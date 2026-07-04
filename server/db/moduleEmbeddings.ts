import supabase from './supabase';
import { embed } from '../services/embeddings';
import { sha256, compareHashes} from '../domain/embedding/hash';


export async function syncModuleEmbeddings() {
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('module_code, module_name, description');
  
  if (modulesError) {
    throw new Error(`Error fetching modules: ${modulesError.message}`);
  }

  const { data: existing, error: embeddingsError } = await supabase
    .from('module_embeddings')
    .select('module_code, source_hash');
  
  if (embeddingsError) {
    throw new Error(`Error fetching embeddings: ${embeddingsError.message}`);
  }

  const existingMap = new Map(existing.map(row => [row.module_code, row.source_hash]));

  for (const row of modules.slice(0, 3)) {
    const text = `${row.module_name ?? ''} ${row.description ?? ''}`.trim();
    const storedHash = existingMap.get(row.module_code);  
    const currentHash = sha256(text);
    
    if (compareHashes(currentHash, storedHash)) continue;

    try {
      const embedding = await embed(text, 'RETRIEVAL_DOCUMENT');
      const { error } = await supabase
        .from('module_embeddings')
        .upsert(
          { module_code: row.module_code, embedding, source_hash: currentHash },
          { onConflict: 'module_code' }
        );
      if (error) {
        console.error(`Failed to update ${row.module_code}:`, error.message);
        continue;
      }
      existingMap.set(row.module_code, currentHash);
    } catch (err) {
      console.error(`Failed to embed ${row.module_code}:`, err instanceof Error ? err.message : String(err));
    }
  }
}

