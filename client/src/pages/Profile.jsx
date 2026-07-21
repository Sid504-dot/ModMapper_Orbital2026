import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { BACKEND } from '../constants'
import { parseApi } from '../utils/api'

const SU_ALLOWANCE = 32

const s = {
    page: { display: 'flex', minHeight: '100vh', background: '#fdf8f2' },
    main: { marginLeft: '220px', flex: 1, padding: '36px 40px' },
    pageTitle: { fontSize: '22px', fontWeight: '600', color: '#1a2744', letterSpacing: '-0.025em' },
    pageSub: { fontSize: '13px', color: '#7a6a5a', marginTop: '2px', marginBottom: '28px' },
    loading: { padding: '48px 0', textAlign: 'center', color: '#7a6a5a', fontSize: '13px' },

    section: { background: '#f5edd8', border: '0.5px solid #d4c4a8', borderRadius: '10px', marginBottom: '16px', overflow: 'hidden' },
    sectionHeader: { padding: '14px 20px', borderBottom: '0.5px solid #d4c4a8' },
    sectionTitle: { fontSize: '13px', fontWeight: '600', color: '#1a2744', letterSpacing: '-0.01em' },
    sectionBody: { padding: '18px 20px' },

    fieldRow: { marginBottom: '14px' },
    label: { display: 'block', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#7a6a5a', marginBottom: '7px' },
    input: { width: '100%', padding: '10px 14px', background: '#fff', border: '0.5px solid #d4c4a8', borderRadius: '6px', fontSize: '13px', color: '#1a2744', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
    inputReadonly: { width: '100%', padding: '10px 14px', background: '#ede8e0', border: '0.5px solid #d4c4a8', borderRadius: '6px', fontSize: '13px', color: '#7a6a5a', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', cursor: 'default' },
    inputNarrow: { width: '140px', padding: '10px 14px', background: '#fff', border: '0.5px solid #d4c4a8', borderRadius: '6px', fontSize: '13px', color: '#1a2744', fontFamily: "'JetBrains Mono', monospace", outline: 'none', boxSizing: 'border-box', textAlign: 'center' },
    textarea: { width: '100%', minHeight: '80px', padding: '10px 14px', background: '#fff', border: '0.5px solid #d4c4a8', borderRadius: '6px', fontSize: '13px', color: '#1a2744', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 },
    hint: { fontSize: '11px', color: '#b0a090', fontFamily: "'JetBrains Mono', monospace", marginTop: '6px' },

    footer: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' },
    saveBtn: { padding: '8px 18px', background: '#b85c38', color: '#fdf8f2', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.02em' },
    saveBtnDisabled: { padding: '8px 18px', background: '#d4c4a8', color: '#fdf8f2', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: '600', cursor: 'not-allowed', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.02em' },
    statusOk: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#2e7d32' },
    statusErr: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#b71c1c' },

    suTrack: { height: '6px', borderRadius: '3px', background: '#d4c4a8', marginTop: '12px', overflow: 'hidden' },
    suStats: { display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#7a6a5a' },
}

function StatusLine({ status }) {
    if (!status) return null
    const isOk = status === 'saved' || status.startsWith('✓')
    return <span style={isOk ? s.statusOk : s.statusErr}>{status === 'saved' ? '✓ Saved' : status}</span>
}

function Profile() {
    const navigate = useNavigate()
    const wasMatricYearUnset = useRef(false)
    const [userEmail] = useState(() => localStorage.getItem('userEmail') || '')
    const [loading, setLoading] = useState(true)

    const [name, setName] = useState('')
    const [nameSaving, setNameSaving] = useState(false)
    const [nameStatus, setNameStatus] = useState('')

    const [matricYear, setMatricYear] = useState('')
    const [yearSaving, setYearSaving] = useState(false)
    const [yearStatus, setYearStatus] = useState('')

    const [interest, setInterest] = useState('')
    const [interestSaving, setInterestSaving] = useState(false)
    const [interestStatus, setInterestStatus] = useState('')

    const [usedSu, setUsedSu] = useState('')
    const [suSaving, setSuSaving] = useState(false)
    const [suStatus, setSuStatus] = useState('')

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const res = await fetch(`${BACKEND}/profile/userProfile`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                })
                const result = await parseApi(res)
                if (cancelled) return
                if (result.ok && result.data) {
                    setName(result.data.profile_name ?? '')
                    if (result.data.start_matric_year != null) {
                        setMatricYear(String(result.data.start_matric_year))
                    } else {
                        wasMatricYearUnset.current = true
                    }
                    setInterest(result.data.interest ?? '')
                    setUsedSu(result.data.used_su != null ? String(result.data.used_su) : '')
                } else {
                    wasMatricYearUnset.current = true
                }
            } catch {
                // fields stay blank — GET endpoint may not be live yet
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [])

    const autoExpire = (setter) => setTimeout(() => setter(''), 3000)

    const saveName = async () => {
        if (!name.trim() || nameSaving) return
        setNameSaving(true); setNameStatus('')
        try {
            const res = await fetch(`${BACKEND}/profile/updateProfileName`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ newName: name.trim() }),
            })
            const result = await parseApi(res)
            setNameStatus(result.ok ? 'saved' : result.error || 'Error saving')
            autoExpire(setNameStatus)
        } catch { setNameStatus('Network error') }
        finally { setNameSaving(false) }
    }

    const saveMatricYear = async () => {
        const year = Number(matricYear)
        if (!year || yearSaving) return
        setYearSaving(true); setYearStatus('')
        try {
            const res = await fetch(`${BACKEND}/profile/updateMatricYear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ newMatricYear: year }),
            })
            const result = await parseApi(res)
            if (result.ok) {
                if (wasMatricYearUnset.current) {
                    wasMatricYearUnset.current = false
                    setYearStatus('✓ You\'re all set!')
                    setTimeout(() => navigate('/dashboard'), 1500)
                } else {
                    setYearStatus('saved')
                    autoExpire(setYearStatus)
                }
            } else {
                setYearStatus(result.error || 'Error saving')
            }
        } catch { setYearStatus('Network error') }
        finally { setYearSaving(false) }
    }

    const saveInterest = async () => {
        if (!interest.trim() || interestSaving) return
        setInterestSaving(true); setInterestStatus('')
        try {
            const res = await fetch(`${BACKEND}/profile/updateUserInterest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ newInterest: interest.trim() }),
            })
            const result = await parseApi(res)
            setInterestStatus(result.ok ? 'saved' : result.error || 'Error saving')
            autoExpire(setInterestStatus)
        } catch { setInterestStatus('Network error') }
        finally { setInterestSaving(false) }
    }

    const saveUsedSu = async () => {
        const val = Number(usedSu)
        if (isNaN(val) || val < 0 || suSaving) return
        setSuSaving(true); setSuStatus('')
        try {
            const res = await fetch(`${BACKEND}/profile/updateUsedSu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ newUsedSu: val }),
            })
            const result = await parseApi(res)
            setSuStatus(result.ok ? 'saved' : result.error || 'Error saving')
            autoExpire(setSuStatus)
        } catch { setSuStatus('Network error') }
        finally { setSuSaving(false) }
    }

    const usedSuNum = Number(usedSu) || 0
    const remainingSu = Math.max(0, SU_ALLOWANCE - usedSuNum)
    const suPct = Math.min(100, (usedSuNum / SU_ALLOWANCE) * 100)
    const suBarColor = suPct > 90 ? '#b71c1c' : '#b85c38'

    return (
        <div style={s.page}>
            <Sidebar active="profile" userEmail={userEmail} />
            <div style={s.main}>
                <div style={s.pageTitle}>Profile Settings</div>
                <div style={s.pageSub}>Manage your account information and academic preferences</div>

                {loading ? (
                    <div style={s.loading}>Loading profile...</div>
                ) : (
                    <>
                        {/* Personal Info */}
                        <div style={s.section}>
                            <div style={s.sectionHeader}><div style={s.sectionTitle}>Personal Info</div></div>
                            <div style={s.sectionBody}>
                                <div style={s.fieldRow}>
                                    <label style={s.label}>Display Name</label>
                                    <input style={s.input} placeholder="e.g. Alex Tan" value={name}
                                        onChange={e => { setName(e.target.value); setNameStatus('') }} />
                                </div>
                                <div style={s.fieldRow}>
                                    <label style={s.label}>Email</label>
                                    <input style={s.inputReadonly} value={userEmail} readOnly />
                                    <div style={s.hint}>Linked to your NUS account — cannot be changed here</div>
                                </div>
                                <div style={s.footer}>
                                    <StatusLine status={nameStatus} />
                                    <button style={name.trim() && !nameSaving ? s.saveBtn : s.saveBtnDisabled}
                                        onClick={saveName} disabled={!name.trim() || nameSaving}>
                                        {nameSaving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Academic */}
                        <div style={s.section}>
                            <div style={s.sectionHeader}><div style={s.sectionTitle}>Academic</div></div>
                            <div style={s.sectionBody}>
                                <div style={s.fieldRow}>
                                    <label style={s.label}>Matric Year</label>
                                    <input style={s.inputNarrow} type="number" placeholder="2023"
                                        min="2000" max="2030" value={matricYear}
                                        onChange={e => { setMatricYear(e.target.value); setYearStatus('') }} />
                                    <div style={s.hint}>The AY you started NUS — e.g. 2023 for AY2023/24</div>
                                </div>
                                <div style={s.footer}>
                                    <StatusLine status={yearStatus} />
                                    <button style={matricYear && !yearSaving ? s.saveBtn : s.saveBtnDisabled}
                                        onClick={saveMatricYear} disabled={!matricYear || yearSaving}>
                                        {yearSaving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Interests */}
                        <div style={s.section}>
                            <div style={s.sectionHeader}><div style={s.sectionTitle}>Interests</div></div>
                            <div style={s.sectionBody}>
                                <div style={s.fieldRow}>
                                    <label style={s.label}>Academic Interests</label>
                                    <textarea style={s.textarea}
                                        placeholder="e.g. machine learning, behavioural economics, product design..."
                                        value={interest}
                                        onChange={e => { setInterest(e.target.value); setInterestStatus('') }} />
                                    <div style={s.hint}>Used by UE Recommender to personalise module suggestions</div>
                                </div>
                                <div style={s.footer}>
                                    <StatusLine status={interestStatus} />
                                    <button style={interest.trim() && !interestSaving ? s.saveBtn : s.saveBtnDisabled}
                                        onClick={saveInterest} disabled={!interest.trim() || interestSaving}>
                                        {interestSaving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* S/U Credits */}
                        <div style={s.section}>
                            <div style={s.sectionHeader}><div style={s.sectionTitle}>S/U Credits</div></div>
                            <div style={s.sectionBody}>
                                <div style={s.fieldRow}>
                                    <label style={s.label}>MCs Already Exercised</label>
                                    <input style={s.inputNarrow} type="number" placeholder="0"
                                        min="0" max={SU_ALLOWANCE} value={usedSu}
                                        onChange={e => { setUsedSu(e.target.value); setSuStatus('') }} />
                                    <div style={s.suTrack}>
                                        <div style={{ height: '100%', width: `${suPct}%`, background: suBarColor, borderRadius: '3px', transition: 'width 0.2s' }} />
                                    </div>
                                    <div style={s.suStats}>
                                        <span>{usedSuNum} MC used</span>
                                        <span>{remainingSu} of {SU_ALLOWANCE} MC remaining</span>
                                    </div>
                                    <div style={{ ...s.hint, marginTop: '8px' }}>
                                        NUS students get {SU_ALLOWANCE} MCs of S/U options. The S/U Optimiser uses this to show your remaining balance.
                                    </div>
                                </div>
                                <div style={s.footer}>
                                    <StatusLine status={suStatus} />
                                    <button style={usedSu !== '' && !suSaving ? s.saveBtn : s.saveBtnDisabled}
                                        onClick={saveUsedSu} disabled={usedSu === '' || suSaving}>
                                        {suSaving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Profile
