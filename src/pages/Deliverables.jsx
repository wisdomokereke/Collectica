import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Upload, FileText, CheckCircle,
  Clock, XCircle, AlertTriangle, Sparkles,
  Loader2, Eye, RotateCcw, Check, X,
  Image, File, Code, Video, ChevronRight, Shield
} from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useAuth, ROLES } from '../lib/AuthContext'

// ── Demo data ──────────────────────────────────────────────
const DELIVERABLES = [
  {
    id: 'd1',
    contract: 'Brand Identity — TechFlow Nigeria',
    milestone: 'Milestone 2 — Logo Concepts',
    submittedBy: 'Ade Okonkwo',
    submittedAt: '2 hours ago',
    fileType: 'image',
    fileName: 'techflow_logo_concepts_v1.zip',
    fileSize: '14.2 MB',
    status: 'pending',
    amount: '₦135,000',
    aiScore: 91,
    aiVerdict: 'pass',
    aiSummary: 'Submission matches contract scope. 3 logo concepts delivered as specified. File format (ZIP with AI + PNG exports) meets requirements.',
    contractScope: 'Deliver 3 logo concept options in AI and PNG format, each with a brief rationale.',
  },
  {
    id: 'd2',
    contract: 'Social Media Kit — Kemi Adeyemi',
    milestone: 'Milestone 1 — Full Delivery',
    submittedBy: 'Ade Okonkwo',
    submittedAt: '1 day ago',
    fileType: 'image',
    fileName: 'kemi_social_kit_final.zip',
    fileSize: '8.7 MB',
    status: 'approved',
    amount: '₦180,000',
    aiScore: 97,
    aiVerdict: 'pass',
    aiSummary: 'All deliverables present. 12 post templates, 4 story templates, and brand colour guide included. Exceeds scope requirements.',
    contractScope: 'Deliver 10+ post templates and story templates with brand guide.',
  },
  {
    id: 'd3',
    contract: 'Pitch Deck — BuildLagos',
    milestone: 'Milestone 1 — Draft Slides',
    submittedBy: 'Ade Okonkwo',
    submittedAt: '3 days ago',
    fileType: 'file',
    fileName: 'buildlagos_deck_draft.pdf',
    fileSize: '3.1 MB',
    status: 'revision',
    amount: '₦105,000',
    aiScore: 58,
    aiVerdict: 'warn',
    aiSummary: 'Partial match. 12 of 15 agreed slides delivered. Missing: Market Analysis, Competitive Landscape, and Financial Projections sections.',
    contractScope: 'Deliver 15 slides covering product overview, market analysis, competitive landscape, traction, team, and financial projections.',
    revisionNote: 'Please include the missing 3 slides — market analysis, competitive landscape, and financial projections — before resubmission.',
  },
  {
    id: 'd4',
    contract: 'Brand Identity — TechFlow Nigeria',
    milestone: 'Milestone 1 — Discovery & Moodboard',
    submittedBy: 'Ade Okonkwo',
    submittedAt: '5 days ago',
    fileType: 'file',
    fileName: 'techflow_moodboard.pdf',
    fileSize: '5.4 MB',
    status: 'approved',
    amount: '₦90,000',
    aiScore: 95,
    aiVerdict: 'pass',
    aiSummary: 'Moodboard and discovery document complete. Direction aligns with brief. Client approved within 4 hours.',
    contractScope: 'Deliver a moodboard and discovery document establishing visual direction.',
  },
]

const CONTRACTS_FOR_SUBMIT = [
  { id: 'c1', name: 'Brand Identity — TechFlow Nigeria',  milestone: 'Milestone 3 — Final Brand Guidelines', amount: '₦225,000' },
  { id: 'c2', name: 'Pitch Deck — BuildLagos',            milestone: 'Milestone 1 — Draft Slides (Revision)', amount: '₦105,000' },
]

const STATUS_CONFIG = {
  pending:  { label: 'Pending Review', icon: <Clock size={13}/>,         color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  approved: { label: 'Approved',       icon: <CheckCircle size={13}/>,    color: 'text-green-500',  bg: 'bg-green-500/10',  border: 'border-green-500/20'  },
  revision: { label: 'Needs Revision', icon: <RotateCcw size={13}/>,      color: 'text-red-500',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
  awaiting: { label: 'Awaiting',       icon: <AlertTriangle size={13}/>,  color: 'text-[#888]',     bg: 'bg-white/5',       border: 'border-white/10'      },
}

const FILE_ICONS = {
  image: <Image size={18}/>,
  video: <Video size={18}/>,
  code:  <Code size={18}/>,
  file:  <File size={18}/>,
}

// ── AI scope check simulation ──────────────────────────────
async function runAiCheck(setProgress, setStatus, setResult, scope, fileName) {
  const steps = [
    { msg: 'Reading file metadata...', pct: 15 },
    { msg: 'Analysing file structure...', pct: 30 },
    { msg: 'Comparing against contract scope...', pct: 55 },
    { msg: 'Checking deliverable requirements...', pct: 75 },
    { msg: 'Generating verdict...', pct: 90 },
    { msg: 'Complete.', pct: 100 },
  ]
  for (const step of steps) {
    await new Promise(r => setTimeout(r, 500))
    setStatus(step.msg)
    setProgress(step.pct)
  }
  await new Promise(r => setTimeout(r, 300))
  // Fake result based on file name
  setResult({
    score: 88,
    verdict: 'pass',
    summary: `File "${fileName}" has been analysed against the contract scope. The deliverable appears to meet the core requirements. All specified formats and components are present.`,
    checks: [
      { label: 'File format matches requirement',    pass: true  },
      { label: 'Deliverable components complete',    pass: true  },
      { label: 'Scope requirements addressed',       pass: true  },
      { label: 'Revision count within limit',        pass: true  },
      { label: 'Submission deadline met',            pass: fileName.includes('late') ? false : true },
    ],
  })
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  )
}

// ── Main component ─────────────────────────────────────────
export default function Deliverables() {
  const { theme, toggle } = useTheme()
  const { user, activeView } = useAuth()
  const isDark = theme === 'dark'

  const [activeTab, setActiveTab]         = useState('all')
  const [showSubmit, setShowSubmit]       = useState(false)
  const [selectedContract, setSelectedContract] = useState('')
  const [dragOver, setDragOver]           = useState(false)
  const [uploadedFile, setUploadedFile]   = useState(null)
  const [checking, setChecking]           = useState(false)
  const [checkProgress, setCheckProgress] = useState(0)
  const [checkStatus, setCheckStatus]     = useState('')
  const [checkResult, setCheckResult]     = useState(null)
  const [submitting, setSubmitting]       = useState(false)
  const [submitted, setSubmitted]         = useState(false)
  const [selectedDeliverable, setSelectedDeliverable] = useState(null)
  const fileInputRef = useRef(null)

  const isFreelancer = activeView === ROLES.FREELANCER

  const c = {
    bg:      isDark ? 'bg-[#0a0a0a]'     : 'bg-[#f8f8f8]',
    card:    isDark ? 'bg-[#111]'        : 'bg-white',
    bgMid:   isDark ? 'bg-[#1a1a1a]'     : 'bg-[#f0f0f0]',
    bgAcc:   isDark ? 'bg-[#242424]'     : 'bg-[#e8e8e8]',
    border:  isDark ? 'border-[#2e2e2e]' : 'border-[#e0e0e0]',
    text:    isDark ? 'text-white'       : 'text-[#0a0a0a]',
    muted:   isDark ? 'text-[#555]'      : 'text-[#aaa]',
    light:   isDark ? 'text-[#888]'      : 'text-[#666]',
    input:   isDark
      ? 'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e] focus:border-white'
      : 'bg-white text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0] focus:border-[#0a0a0a]',
    btnPrim: isDark ? 'bg-white text-[#0a0a0a] hover:bg-[#f0f0f0]' : 'bg-[#0a0a0a] text-white hover:bg-[#222]',
    btnGhost:isDark ? 'border-[#2e2e2e] text-[#888] hover:text-white' : 'border-[#e0e0e0] text-[#666] hover:text-[#0a0a0a]',
    divider: isDark ? 'bg-[#2e2e2e]'     : 'bg-[#e0e0e0]',
    tab:     isDark ? 'text-[#555] hover:text-white' : 'text-[#aaa] hover:text-[#0a0a0a]',
    tabAct:  isDark ? 'text-white border-b-2 border-white' : 'text-[#0a0a0a] border-b-2 border-[#0a0a0a]',
  }

  const filtered = activeTab === 'all'
    ? DELIVERABLES
    : DELIVERABLES.filter(d => d.status === activeTab)

  const handleFileDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer?.files[0] || e.target?.files[0]
    if (file) setUploadedFile(file)
  }

  const handleAiCheck = async () => {
    if (!uploadedFile || !selectedContract) return
    setChecking(true); setCheckProgress(0); setCheckResult(null)
    const contract = CONTRACTS_FOR_SUBMIT.find(c => c.id === selectedContract)
    await runAiCheck(setCheckProgress, setCheckStatus, setCheckResult, contract?.milestone || '', uploadedFile.name)
    setChecking(false)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1500))
    setSubmitting(false); setSubmitted(true)
  }

  const resetSubmit = () => {
    setShowSubmit(false); setUploadedFile(null); setSelectedContract('')
    setCheckResult(null); setCheckProgress(0); setCheckStatus(''); setSubmitted(false)
  }

  // ── Detail modal ──
  const DetailModal = ({ d, onClose }) => {
    const s = STATUS_CONFIG[d.status]
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
        <div className={`relative w-full max-w-lg ${c.card} border ${c.border} rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto`}
          onClick={e => e.stopPropagation()}>
          <div className={`flex items-center justify-between px-6 py-4 border-b ${c.border}`}>
            <p className={`font-bold ${c.text}`}>Deliverable Detail</p>
            <button onClick={onClose} className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bgMid} ${c.light}`}>
              <X size={15}/>
            </button>
          </div>
          <div className="p-6 space-y-5">
            {/* Status */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${s.border} ${s.bg} w-fit`}>
              <span className={s.color}>{s.icon}</span>
              <span className={`text-xs font-bold ${s.color}`}>{s.label}</span>
            </div>

            {/* Contract info */}
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-1`}>Contract</p>
              <p className={`text-sm font-bold ${c.text}`}>{d.contract}</p>
              <p className={`text-xs ${c.muted} mt-0.5`}>{d.milestone}</p>
            </div>

            {/* File */}
            <div className={`flex items-center gap-3 p-4 rounded-xl ${c.bgMid} border ${c.border}`}>
              <div className={`w-10 h-10 rounded-xl ${c.bgAcc} border ${c.border} flex items-center justify-center ${c.light}`}>
                {FILE_ICONS[d.fileType]}
              </div>
              <div>
                <p className={`text-sm font-bold ${c.text}`}>{d.fileName}</p>
                <p className={`text-xs ${c.muted}`}>{d.fileSize} · Submitted {d.submittedAt}</p>
              </div>
            </div>

            {/* AI check result */}
            <div className={`border rounded-2xl overflow-hidden ${d.aiVerdict === 'pass' ? 'border-green-500/20' : 'border-orange-500/20'}`}>
              <div className={`flex items-center gap-2 px-4 py-3 ${d.aiVerdict === 'pass' ? 'bg-green-500/5' : 'bg-orange-500/5'}`}>
                <Sparkles size={13} className={d.aiVerdict === 'pass' ? 'text-green-500' : 'text-orange-500'}/>
                <p className={`text-xs font-bold ${d.aiVerdict === 'pass' ? 'text-green-500' : 'text-orange-500'}`}>
                  AI Scope Check — Score: {d.aiScore}/100
                </p>
              </div>
              <div className="px-4 py-3">
                <p className={`text-xs leading-relaxed ${c.light}`}>{d.aiSummary}</p>
              </div>
            </div>

            {/* Revision note */}
            {d.revisionNote && (
              <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4">
                <p className="text-xs font-bold text-red-500 mb-1">Revision Requested</p>
                <p className={`text-xs leading-relaxed ${c.light}`}>{d.revisionNote}</p>
              </div>
            )}

            {/* Payment */}
            <div className={`flex items-center justify-between p-4 rounded-xl ${c.bgMid} border ${c.border}`}>
              <span className={`text-sm font-bold ${c.text}`}>Milestone Payment</span>
              <span className={`text-lg font-extrabold ${d.status === 'approved' ? 'text-green-500' : c.text}`}>{d.amount}</span>
            </div>

            {/* Actions for client */}
            {!isFreelancer && d.status === 'pending' && (
              <div className="flex gap-3">
                <button className="flex-1 py-3 rounded-xl font-bold text-sm bg-green-500 text-white hover:bg-green-600 transition-all flex items-center justify-center gap-2">
                  <Check size={15}/> Approve & Release
                </button>
                <button className="flex-1 py-3 rounded-xl border font-semibold text-sm border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
                  <RotateCcw size={15}/> Request Revision
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${c.bg}`}>

      {/* Header */}
      <header className={`sticky top-0 z-20 flex items-center justify-between px-6 md:px-10 py-4 border-b ${c.border} ${c.card}`}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className={`flex items-center gap-2 text-sm font-semibold ${c.light} transition-colors`}>
            <ArrowLeft size={15}/> Dashboard
          </Link>
          <div className={`w-px h-4 ${c.divider}`}/>
          <div className="flex items-center gap-2">
            <Upload size={15} className={c.muted}/>
            <span className={`text-sm font-bold ${c.text}`}>Deliverables</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isFreelancer && !showSubmit && (
            <button onClick={() => setShowSubmit(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${c.btnPrim}`}>
              <Upload size={14}/> Submit Work
            </button>
          )}
          <button onClick={toggle}
            className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm transition-all
              ${isDark ? 'border-[#2e2e2e] bg-[#1a1a1a]' : 'border-[#e0e0e0] bg-[#f0f0f0]'}`}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-10 py-10 max-w-5xl mx-auto w-full">

        {/* ══ SUBMIT PANEL ══ */}
        {showSubmit && (
          <div className={`${c.card} border ${c.border} rounded-2xl overflow-hidden mb-8`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${c.border}`}>
              <div className="flex items-center gap-2">
                <Upload size={15} className={c.muted}/>
                <span className={`text-sm font-bold ${c.text}`}>Submit Work</span>
              </div>
              <button onClick={resetSubmit} className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bgMid} ${c.light}`}>
                <X size={15}/>
              </button>
            </div>

            {submitted ? (
              // Success state
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-3xl mx-auto mb-5">✅</div>
                <h3 className={`text-xl font-extrabold ${c.text} mb-2`}>Work Submitted!</h3>
                <p className={`text-sm ${c.light} max-w-sm mx-auto mb-6`}>Your deliverable has been submitted and the client has been notified. Escrow will be released upon approval.</p>
                <div className={`${c.bgMid} border ${c.border} rounded-xl p-4 text-left max-w-xs mx-auto mb-6`}>
                  <div className="flex justify-between py-1.5 border-b" style={{borderColor: isDark ? '#2e2e2e' : '#e8e8e8'}}>
                    <span className={`text-xs ${c.muted}`}>File</span>
                    <span className={`text-xs font-bold ${c.text}`}>{uploadedFile?.name}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className={`text-xs ${c.muted}`}>AI Score</span>
                    <span className="text-xs font-bold text-green-500">{checkResult?.score}/100 ✓</span>
                  </div>
                </div>
                <button onClick={resetSubmit} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${c.btnPrim}`}>
                  Done
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Select contract */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Select Contract & Milestone</label>
                  <select value={selectedContract} onChange={e => setSelectedContract(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${c.input}`}>
                    <option value="">Choose a contract...</option>
                    {CONTRACTS_FOR_SUBMIT.map(ct => (
                      <option key={ct.id} value={ct.id}>{ct.name} — {ct.milestone}</option>
                    ))}
                  </select>
                </div>

                {/* Drop zone */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Upload File</label>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
                      ${dragOver
                        ? 'border-green-500 bg-green-500/5'
                        : uploadedFile
                          ? 'border-green-500/40 bg-green-500/5'
                          : `${c.border} ${isDark ? 'hover:border-[#555]' : 'hover:border-[#999]'}`}`}>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileDrop}/>
                    {uploadedFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500`}>
                          <Check size={20}/>
                        </div>
                        <p className={`text-sm font-bold ${c.text}`}>{uploadedFile.name}</p>
                        <p className={`text-xs ${c.muted}`}>{(uploadedFile.size / 1024 / 1024).toFixed(1)} MB · Click to change</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${c.bgMid} border ${c.border} flex items-center justify-center ${c.muted}`}>
                          <Upload size={20}/>
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${c.text}`}>Drop your file here or click to browse</p>
                          <p className={`text-xs ${c.muted} mt-1`}>ZIP, PDF, PNG, MP4, or any file up to 100MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Scope Check */}
                {uploadedFile && selectedContract && !checkResult && (
                  <button onClick={handleAiCheck} disabled={checking}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60
                      ${isDark ? 'bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20' : 'bg-green-500/10 border border-green-500/20 text-green-600 hover:bg-green-500/20'}`}>
                    {checking ? <><Spinner/> {checkStatus || 'Analysing...'}</> : <><Sparkles size={15}/> Run AI Scope Check</>}
                  </button>
                )}

                {/* Check progress */}
                {checking && (
                  <div>
                    <div className={`h-1.5 rounded-full ${isDark ? 'bg-[#2e2e2e]' : 'bg-[#e8e8e8]'}`}>
                      <div className="h-1.5 rounded-full bg-green-500 transition-all duration-500" style={{width: `${checkProgress}%`}}/>
                    </div>
                    <p className={`text-xs mt-2 ${c.muted}`}>{checkStatus}</p>
                  </div>
                )}

                {/* AI result */}
                {checkResult && (
                  <div className={`border rounded-2xl overflow-hidden ${checkResult.verdict === 'pass' ? 'border-green-500/20' : 'border-orange-500/20'}`}>
                    <div className={`flex items-center justify-between px-4 py-3 ${checkResult.verdict === 'pass' ? 'bg-green-500/5' : 'bg-orange-500/5'}`}>
                      <div className="flex items-center gap-2">
                        <Sparkles size={13} className={checkResult.verdict === 'pass' ? 'text-green-500' : 'text-orange-500'}/>
                        <p className={`text-xs font-bold ${checkResult.verdict === 'pass' ? 'text-green-500' : 'text-orange-500'}`}>
                          AI Scope Check — {checkResult.score}/100
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${checkResult.verdict === 'pass' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
                        {checkResult.verdict === 'pass' ? '✓ Scope Met' : '⚠ Partial'}
                      </span>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      <p className={`text-xs leading-relaxed ${c.light} mb-3`}>{checkResult.summary}</p>
                      {checkResult.checks.map((chk, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${chk.pass ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                            {chk.pass ? <Check size={9}/> : <X size={9}/>}
                          </div>
                          <p className={`text-xs ${chk.pass ? c.light : 'text-red-400'}`}>{chk.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit button */}
                {checkResult && (
                  <button onClick={handleSubmit} disabled={submitting}
                    className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${c.btnPrim}`}>
                    {submitting ? <><Spinner/> Submitting...</> : <><Upload size={15}/> Submit to Client</>}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Page title ── */}
        {!showSubmit && (
          <div className="mb-8">
            <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>
              {isFreelancer ? 'Your Submissions' : 'Submitted Work'}
            </p>
            <h1 className={`text-4xl font-extrabold tracking-tight ${c.text}`}>Deliverables</h1>
            <p className={`text-sm ${c.light} mt-1`}>
              {isFreelancer
                ? 'All work you\'ve submitted across active contracts. AI verifies each against scope before the client sees it.'
                : 'Review and approve submitted work. Payment is released automatically upon approval.'}
            </p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Submitted', value: DELIVERABLES.length,                                              color: null },
            { label: 'Approved',        value: DELIVERABLES.filter(d => d.status === 'approved').length,          color: 'text-green-500' },
            { label: 'Pending Review',  value: DELIVERABLES.filter(d => d.status === 'pending').length,           color: 'text-orange-500' },
            { label: 'Needs Revision',  value: DELIVERABLES.filter(d => d.status === 'revision').length,          color: 'text-red-500' },
          ].map(stat => (
            <div key={stat.label} className={`${c.card} border ${c.border} rounded-2xl p-4`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>{stat.label}</p>
              <p className={`text-3xl font-extrabold tracking-tight ${stat.color || c.text}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={`flex gap-6 border-b ${c.border} mb-6`}>
          {[
            { key: 'all',      label: 'All',             count: DELIVERABLES.length },
            { key: 'pending',  label: 'Pending Review',  count: DELIVERABLES.filter(d => d.status === 'pending').length },
            { key: 'approved', label: 'Approved',        count: DELIVERABLES.filter(d => d.status === 'approved').length },
            { key: 'revision', label: 'Needs Revision',  count: DELIVERABLES.filter(d => d.status === 'revision').length },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-bold transition-all flex items-center gap-1.5
                ${activeTab === tab.key ? c.tabAct : c.tab}`}>
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                  ${activeTab === tab.key
                    ? isDark ? 'bg-white text-[#0a0a0a]' : 'bg-[#0a0a0a] text-white'
                    : isDark ? 'bg-[#2e2e2e] text-[#888]' : 'bg-[#e0e0e0] text-[#666]'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Deliverables list */}
        <div className="space-y-3">
          {filtered.map(d => {
            const s = STATUS_CONFIG[d.status]
            return (
              <div key={d.id}
                onClick={() => setSelectedDeliverable(d)}
                className={`${c.card} border ${c.border} rounded-2xl p-5 cursor-pointer transition-all
                  ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-[#f8f8f8]'} hover:scale-[1.005]`}>
                <div className="flex items-start gap-4">
                  {/* File type icon */}
                  <div className={`w-11 h-11 rounded-xl ${c.bgMid} border ${c.border} flex items-center justify-center flex-shrink-0 ${c.light}`}>
                    {FILE_ICONS[d.fileType]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className={`text-sm font-bold ${c.text}`}>{d.contract}</p>
                        <p className={`text-xs ${c.muted} mt-0.5`}>{d.milestone}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${s.border} ${s.bg} ${s.color}`}>
                          {s.icon} {s.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      {/* File info */}
                      <div className={`flex items-center gap-1.5 text-xs ${c.muted}`}>
                        <File size={11}/>
                        <span>{d.fileName}</span>
                        <span>·</span>
                        <span>{d.fileSize}</span>
                      </div>
                      {/* Time */}
                      <div className={`flex items-center gap-1.5 text-xs ${c.muted}`}>
                        <Clock size={11}/> {d.submittedAt}
                      </div>
                      {/* AI score */}
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${d.aiVerdict === 'pass' ? 'text-green-500' : 'text-orange-500'}`}>
                        <Sparkles size={11}/>
                        AI Score: {d.aiScore}/100
                      </div>
                    </div>
                  </div>

                  {/* Amount + arrow */}
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                    <p className={`text-base font-extrabold tracking-tight ${d.status === 'approved' ? 'text-green-500' : c.text}`}>{d.amount}</p>
                    <ChevronRight size={15} className={c.muted}/>
                  </div>
                </div>

                {/* Revision note preview */}
                {d.revisionNote && (
                  <div className="mt-3 px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/5 flex items-start gap-2">
                    <RotateCcw size={11} className="text-red-500 mt-0.5 flex-shrink-0"/>
                    <p className="text-xs text-red-400 leading-relaxed line-clamp-1">{d.revisionNote}</p>
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className={`${c.card} border ${c.border} rounded-2xl p-16 text-center`}>
              <div className="text-4xl mb-3">📭</div>
              <p className={`font-bold ${c.text}`}>No deliverables here</p>
              <p className={`text-sm ${c.light} mt-1`}>Nothing in this category yet.</p>
            </div>
          )}
        </div>

      </main>

      {/* Detail modal */}
      {selectedDeliverable && (
        <DetailModal d={selectedDeliverable} onClose={() => setSelectedDeliverable(null)}/>
      )}
    </div>
  )
}
