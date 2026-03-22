import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Send, Paperclip, Search, Shield, FileText,
  Wallet, AlertTriangle, X, Sparkles, Lock, File,
  ChevronRight, Loader2, Bot, Briefcase, Bell, Plus,
  CheckCircle, Clock, DollarSign, ChevronDown, ChevronUp,
  Circle, AlertCircle, XCircle
} from 'lucide-react'import { useTheme } from '../lib/ThemeContext'
import { useAuth, ROLES } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const SCAM_WORDS = [
  'outside the platform','pay me directly','whatsapp me',
  'bank transfer directly','bypass','off platform','my personal account',
  'send to my account','pay cash'
]
const COLLE_TRIGGER = /^colle\b/i

// ── Notification helpers ───────────────────────────────────
function notifIcon(type) {
  const icons = {
    message:    '💬',
    milestone:  '📋',
    payment:    '💸',
    contract:   '📄',
    dispute:    '⚠️',
    deposit:    '💳',
    escrow_release: '✅',
    system:     '🔔',
  }
  return icons[type] || '🔔'
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return new Date(date).toLocaleDateString()
}

// ── Milestone status config ────────────────────────────────
const MS_STATUS = {
  pending:            { label: 'Pending',    color: 'text-[#888]',     dot: 'bg-[#555]'      },
  in_progress:        { label: 'In Progress',color: 'text-blue-400',   dot: 'bg-blue-400'    },
  submitted:          { label: 'Submitted',  color: 'text-orange-500', dot: 'bg-orange-500'  },
  revision_requested: { label: 'Revision',   color: 'text-red-400',    dot: 'bg-red-400'     },
  approved:           { label: 'Approved',   color: 'text-green-500',  dot: 'bg-green-500'   },
  paid:               { label: 'Paid',       color: 'text-green-500',  dot: 'bg-green-500'   },
}

// ── Message bubble ─────────────────────────────────────────
function MsgBubble({ msg, isDark, c, myId, onSignContract }) {
  const isMe = msg.sender_id === myId

  if (msg.type === 'system') return (
    <div className="flex justify-center my-4">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium max-w-xs text-center
        ${isDark ? 'bg-[#1a1a1a] border-[#2e2e2e] text-[#888]' : 'bg-[#f0f0f0] border-[#e0e0e0] text-[#666]'}`}>
        {msg.content}
      </div>
    </div>
  )

  if (msg.type === 'colle') return (
    <div className="flex justify-start my-3 px-2">
      <div className="max-w-[85%] rounded-2xl border overflow-hidden border-green-500/20 bg-green-500/5">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-green-500/20">
          <Bot size={12} className="text-green-500"/>
          <span className="text-xs font-bold text-green-500">Colle AI</span>
          <span className="text-xs text-green-500/40 ml-auto">Collectica AI</span>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs leading-relaxed text-green-400 whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    </div>
  )

  if (msg.type === 'contract_draft') {
    const meta = msg.metadata || {}
    const ct   = meta.contract || {}
    const signedClient     = meta.signed_client
    const signedFreelancer = meta.signed_freelancer
    const bothSigned       = signedClient && signedFreelancer
    const amClient         = myId === meta.client_id
    const amFreelancer     = myId === meta.freelancer_id
    const iSigned          = amClient ? signedClient : signedFreelancer
    const onSign           = onSignContract ? () => onSignContract(msg) : null

    return (
      <div className="flex justify-center my-4 px-2">
        <div className={`w-full max-w-sm rounded-2xl border-2 overflow-hidden
          ${bothSigned ? 'border-green-500/40 bg-green-500/5' : 'border-blue-500/30 bg-blue-500/5'}`}>
          <div className={`flex items-center gap-2 px-4 py-3 border-b ${bothSigned ? 'border-green-500/20' : 'border-blue-500/20'}`}>
            <Bot size={12} className={bothSigned ? 'text-green-500' : 'text-blue-400'}/>
            <span className={`text-xs font-bold ${bothSigned ? 'text-green-500' : 'text-blue-400'}`}>
              {bothSigned ? '✅ Contract Active' : '📄 Contract Draft — Ready to Sign'}
            </span>
          </div>
          <div className="px-4 py-4 space-y-3">
            <div>
              <p className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-[#0a0a0a]'}`}>{ct.title}</p>
              <p className={`text-xs ${c.muted} mt-0.5 leading-relaxed line-clamp-3`}>{ct.scope}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${c.muted}`}>Total Value</span>
              <span className="text-sm font-extrabold text-green-500">
                ₦{ct.total_value?.toLocaleString()}
              </span>
            </div>
            {ct.milestones?.length > 0 && (
              <div className="space-y-1.5">
                <p className={`text-xs font-bold ${c.muted}`}>{ct.milestones.length} Milestones</p>
                {ct.milestones.map((m, i) => (
                  <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#f0f0f0]'}`}>
                    <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-[#0a0a0a]'} truncate flex-1 mr-2`}>{m.title}</p>
                    <p className="text-xs font-bold text-green-500">₦{m.amount?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
            {/* Signature status */}
            <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${isDark ? 'border-[#2e2e2e]' : 'border-[#e0e0e0]'}`}>
              {[
                { label: 'Client',     signed: signedClient     },
                { label: 'Freelancer', signed: signedFreelancer },
              ].map(p => (
                <div key={p.label} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${p.signed ? 'bg-green-500/10' : isDark ? 'bg-[#1a1a1a]' : 'bg-[#f0f0f0]'}`}>
                  {p.signed
                    ? <CheckCircle size={11} className="text-green-500"/>
                    : <Clock size={11} className="text-orange-500"/>}
                  <span className={`text-xs font-bold ${p.signed ? 'text-green-500' : c.muted}`}>
                    {p.label} {p.signed ? '✓' : '...'}
                  </span>
                </div>
              ))}
            </div>
            {/* Sign button */}
            {!bothSigned && !iSigned && onSign && (
              <button onClick={onSign}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all flex items-center justify-center gap-1.5">
                <Shield size={12}/> Sign This Contract
              </button>
            )}
            {!bothSigned && iSigned && (
              <p className="text-center text-xs text-green-500 font-bold py-1">
                ✓ You signed — waiting for the other party
              </p>
            )}
            {bothSigned && (
              <p className="text-center text-xs text-green-500 font-bold py-1">
                ✅ Both parties signed — contract is live!
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (msg.type === 'file') return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3 px-2`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border max-w-[70%]
        ${isMe
          ? isDark ? 'bg-white text-[#0a0a0a] border-white' : 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
          : isDark ? 'bg-[#1a1a1a] text-white border-[#2e2e2e]' : 'bg-white border-[#e0e0e0]'}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
          ${isMe ? 'bg-black/10' : isDark ? 'bg-[#2e2e2e]' : 'bg-[#f0f0f0]'}`}>
          <File size={16}/>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate max-w-[140px]">{msg.file_name || 'File'}</p>
          <p className="text-xs opacity-60">
            {msg.file_size ? `${(msg.file_size/1024/1024).toFixed(1)} MB` : 'Attachment'}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3 px-2`}>
      <div className="max-w-[75%] flex flex-col gap-1">
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
          ${isMe
            ? isDark ? 'bg-white text-[#0a0a0a]' : 'bg-[#0a0a0a] text-white'
            : isDark ? 'bg-[#1a1a1a] text-white border border-[#2e2e2e]' : 'bg-white text-[#0a0a0a] border border-[#e0e0e0]'}`}>
          {msg.content}
        </div>
        <p className={`text-xs px-1 ${c.muted} ${isMe ? 'text-right' : ''}`}>
          {new Date(msg.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
        </p>
      </div>
    </div>
  )
}

// ── Contract + Milestone panel ─────────────────────────────
function ContractPanel({ chatId, isDark, c }) {
  const [contract, setContract]   = useState(null)
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const fetch = async () => {
      // Get contract linked to this chat
      const { data: chatData } = await supabase
        .from('chats')
        .select('contract_id')
        .eq('id', chatId)
        .single()

      if (chatData?.contract_id) {
        const { data: ct } = await supabase
          .from('contracts')
          .select(`
            *, 
            client:users!contracts_client_id_fkey(full_name),
            freelancer:users!contracts_freelancer_id_fkey(full_name)
          `)
          .eq('id', chatData.contract_id)
          .single()

        if (ct) {
          setContract(ct)
          const { data: ms } = await supabase
            .from('milestones')
            .select('*')
            .eq('contract_id', ct.id)
            .order('order_index', { ascending: true })
          if (ms) setMilestones(ms)
        }
      }
      setLoading(false)
    }
    fetch()

    // Real-time milestone updates
    const ch = supabase.channel('panel-' + chatId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, fetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, fetch)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [chatId])

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (!contract) return (
    <div className="px-4 py-6 text-center">
      <div className="text-2xl mb-2">📋</div>
      <p className={`text-xs font-bold ${c.text}`}>No contract yet</p>
      <p className={`text-xs ${c.muted} mt-1`}>
        Type <span className="text-green-500 font-bold">Colle</span> in chat to draft one
      </p>
    </div>
  )

  const CT_STATUS = {
    draft:              { label: 'Draft',          color: 'text-blue-400'    },
    pending_signatures: { label: 'Awaiting Sigs',  color: 'text-orange-500'  },
    active:             { label: 'Active',          color: 'text-green-500'   },
    completed:          { label: 'Completed',       color: 'text-[#888]'      },
    disputed:           { label: 'Disputed',        color: 'text-red-500'     },
  }
  const cs = CT_STATUS[contract.status] || CT_STATUS.draft
  const paidMilestones = milestones.filter(m => m.status === 'paid' || m.status === 'approved').length
  const progress = milestones.length > 0 ? Math.round((paidMilestones / milestones.length) * 100) : 0

  return (
    <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
      {/* Contract summary */}
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>Contract</p>
        <div className={`${isDark ? 'bg-[#1a1a1a]' : 'bg-[#f8f8f8]'} border ${c.border} rounded-xl p-4 space-y-3`}>
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-bold ${c.text} leading-snug`}>{contract.title}</p>
            <span className={`text-xs font-bold flex-shrink-0 ${cs.color}`}>{cs.label}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${c.muted}`}>Total Value</span>
            <span className="text-sm font-extrabold text-green-500">
              ₦{contract.total_value?.toLocaleString()}
            </span>
          </div>
          {/* Signatures */}
          <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${c.border}`}>
            {[
              { name: contract.client?.full_name, label: 'Client', signed: contract.signed_client },
              { name: contract.freelancer?.full_name, label: 'Freelancer', signed: contract.signed_freelancer },
            ].map(p => (
              <div key={p.label} className="flex items-center gap-1.5">
                {p.signed
                  ? <CheckCircle size={11} className="text-green-500 flex-shrink-0"/>
                  : <Clock size={11} className="text-orange-500 flex-shrink-0"/>}
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${c.text}`}>{p.name || p.label}</p>
                  <p className={`text-xs ${p.signed ? 'text-green-500' : 'text-orange-500'}`}>
                    {p.signed ? 'Signed' : 'Pending'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* Progress */}
          {milestones.length > 0 && (
            <div>
              <div className="flex justify-between mb-1">
                <span className={`text-xs ${c.muted}`}>Progress</span>
                <span className={`text-xs font-bold ${c.text}`}>{progress}%</span>
              </div>
              <div className={`h-1.5 rounded-full ${isDark ? 'bg-[#2e2e2e]' : 'bg-[#e0e0e0]'}`}>
                <div className="h-1.5 rounded-full bg-green-500 transition-all" style={{ width: `${progress}%` }}/>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest ${c.muted} mb-2`}>
            Milestones ({milestones.length})
          </p>
          <div className="space-y-2">
            {milestones.map((ms, i) => {
              const s = MS_STATUS[ms.status] || MS_STATUS.pending
              return (
                <div key={ms.id}
                  className={`${isDark ? 'bg-[#1a1a1a]' : 'bg-[#f8f8f8]'} border ${c.border} rounded-xl p-3`}>
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-xs font-bold ${c.text} leading-snug`}>
                          {i + 1}. {ms.title}
                        </p>
                        <span className={`text-xs font-bold flex-shrink-0 ${s.color}`}>{s.label}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs font-bold text-green-500">
                          ₦{ms.amount?.toLocaleString()}
                        </span>
                        {ms.deadline && (
                          <span className={`text-xs ${c.muted}`}>
                            Due {new Date(ms.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {ms.max_revisions > 0 && (
                        <p className={`text-xs ${c.muted} mt-1`}>
                          {ms.revisions_used || 0}/{ms.max_revisions} revisions used
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Escrow status */}
      <div className={`flex items-center gap-2 p-3 rounded-xl
        ${contract.escrow_funded
          ? 'bg-green-500/5 border border-green-500/20'
          : isDark ? 'bg-[#1a1a1a] border border-[#2e2e2e]' : 'bg-[#f8f8f8] border border-[#e0e0e0]'}`}>
        <Lock size={12} className={contract.escrow_funded ? 'text-green-500' : c.muted}/>
        <p className={`text-xs font-bold ${contract.escrow_funded ? 'text-green-500' : c.muted}`}>
          {contract.escrow_funded ? 'Escrow funded — payment protected' : 'Escrow not yet funded'}
        </p>
      </div>
    </div>
  )
}

// ── Chat view ──────────────────────────────────────────────
function ChatView({ chat, isDark, c, onBack, myId, displayName }) {
  const [msgs, setMsgs]             = useState([])
  const [input, setInput]           = useState('')
  const [scamFlag, setScamFlag]     = useState(false)
  const [aiLoading, setAiLoading]   = useState(false)
  const [colleActive, setColleActive] = useState(false)
  const [showPanel, setShowPanel]   = useState(false)
  const [loading, setLoading]       = useState(true)
  const [signingPin, setSigningPin] = useState('')
  const [signingMsgId, setSigningMsgId] = useState(null)
  const bottomRef = useRef(null)
  const fileRef   = useRef(null)

  const partyName = myId === chat.client_id
    ? chat.freelancer?.full_name
    : chat.client?.full_name
  const initials = (partyName || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()

  useEffect(() => {
    fetchMessages()
    const channel = supabase.channel('chat-' + chat.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'messages', filter: `chat_id=eq.${chat.id}`
      }, payload => {
        setMsgs(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [chat.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true })
    if (data) setMsgs(data)
    setLoading(false)
  }

  const sendMsg = async () => {
    const text = input.trim()
    if (!text) return
    if (SCAM_WORDS.some(w => text.toLowerCase().includes(w))) {
      setScamFlag(true); return
    }
    if (COLLE_TRIGGER.test(text)) {
      setInput(''); callColle(text); return
    }
    setInput(''); setScamFlag(false)
    await supabase.from('messages').insert({
      chat_id: chat.id, sender_id: myId, content: text, type: 'text',
    })
  }

  const sendFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const path = `${chat.id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('deliverables').upload(path, file)
    const { data: urlData } = supabase.storage.from('deliverables').getPublicUrl(path)
    await supabase.from('messages').insert({
      chat_id: chat.id, sender_id: myId,
      content: file.name,
      file_url: !error ? urlData.publicUrl : null,
      file_name: file.name, file_size: file.size, type: 'file',
    })
    e.target.value = ''
  }

  const callColle = async (userMessage) => {
    setAiLoading(true); setColleActive(true)
    await supabase.from('messages').insert({
      chat_id: chat.id, sender_id: null,
      content: `${displayName} summoned Colle...`, type: 'system',
    })

    const history = msgs
      .filter(m => m.type === 'text')
      .map(m => `${m.sender_id === myId ? displayName : partyName}: ${m.content}`)
      .join('\n')

    let jobContext = ''
    if (chat.job) {
      jobContext = `\nJob: ${chat.job.title}\nBudget: ₦${chat.job.budget_min?.toLocaleString()} – ₦${chat.job.budget_max?.toLocaleString()}`
      if (chat.job.description) jobContext += `\nDescription: ${chat.job.description}`
      if (chat.job.brief_name) jobContext += `\nBrief attached: ${chat.job.brief_name}`
    }

    // Detect if user wants a contract drafted
    const wantsDraft = /draft|contract|set up|create contract|write contract|scope|agree|deal|milestone/i.test(userMessage)

    const prompt = `${userMessage.length > 6 ? `The user said: "${userMessage}"\n\n` : ''}${jobContext ? `Job Context:${jobContext}\n\n` : ''}Conversation:\n${history || 'No messages yet.'}`

    try {
      if (wantsDraft) {
        // Ask Colle to return structured contract JSON
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514', max_tokens: 2000,
            system: `You are Colle, the AI legal assistant for Collectica. Extract a contract from the conversation and return ONLY valid JSON with this exact structure:
{
  "title": "contract title",
  "scope": "full scope of work description",
  "total_value": 150000,
  "currency": "NGN",
  "milestones": [
    { "title": "milestone name", "description": "what is delivered", "amount": 50000, "order_index": 1 }
  ],
  "summary": "one sentence summary for both parties"
}
Use the budget range from the job context. Split payment across milestones sensibly. Return ONLY the JSON, no other text.`,
            messages: [{ role: 'user', content: prompt }]
          })
        })
        const data = await res.json()
        const raw  = data.content?.[0]?.text || ''
        try {
          const contractData = JSON.parse(raw.replace(/```json|```/g, '').trim())
          // Insert as contract_draft message type with metadata
          await supabase.from('messages').insert({
            chat_id:   chat.id,
            sender_id: null,
            content:   contractData.summary || 'Contract draft ready for review.',
            type:      'contract_draft',
            metadata:  {
              contract:         contractData,
              signed_client:    false,
              signed_freelancer:false,
              client_id:        chat.client_id,
              freelancer_id:    chat.freelancer_id,
            },
          })
        } catch {
          // Fallback to regular Colle message if JSON parse fails
          await supabase.from('messages').insert({
            chat_id: chat.id, sender_id: null, content: raw, type: 'colle',
          })
        }
      } else {
        // Regular Colle response
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514', max_tokens: 1000,
            system: `You are Colle, the AI legal assistant in Collectica — a contract-first freelance platform for Africa. Help the client and freelancer discuss scope, terms, and milestones. When they're ready to formalise, tell them to type "Colle draft contract" to generate a signable contract. Be concise and friendly.`,
            messages: [{ role: 'user', content: prompt }]
          })
        })
        const data = await res.json()
        const text = data.content?.[0]?.text || 'I could not process that. Please try again.'
        await supabase.from('messages').insert({
          chat_id: chat.id, sender_id: null, content: text, type: 'colle',
        })
      }
    } catch {
      await supabase.from('messages').insert({
        chat_id: chat.id, sender_id: null,
        content: 'Having trouble connecting right now. Please try again.',
        type: 'colle',
      })
    } finally { setAiLoading(false) }
  }

  const signContract = async (msg) => {
    const [pin, setPin] = [signingPin, setSigningPin]
    if (!pin || pin.length < 4) { alert('Enter your signing password to sign'); return }

    // Verify signing password
    const { data: userData } = await supabase
      .from('users')
      .select('signing_password')
      .eq('id', myId)
      .single()

    if (userData?.signing_password && userData.signing_password !== pin) {
      alert('Incorrect signing password'); return
    }

    const isClient      = myId === chat.client_id
    const newMeta       = { ...msg.metadata }
    if (isClient) newMeta.signed_client = true
    else          newMeta.signed_freelancer = true

    // Update message metadata
    await supabase.from('messages')
      .update({ metadata: newMeta })
      .eq('id', msg.id)

    // If both signed — create the real contract
    if (newMeta.signed_client && newMeta.signed_freelancer) {
      const ct = newMeta.contract
      const { data: contract } = await supabase
        .from('contracts')
        .insert({
          chat_id:          chat.id,
          job_id:           chat.job_id,
          client_id:        chat.client_id,
          freelancer_id:    chat.freelancer_id,
          title:            ct.title,
          scope:            ct.scope,
          total_value:      ct.total_value,
          currency:         ct.currency || 'NGN',
          status:           'pending_signatures',
          version:          1,
          signed_client:    true,
          signed_client_at: new Date().toISOString(),
          signed_freelancer:true,
          signed_freelancer_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (contract) {
        // Create milestones
        if (ct.milestones?.length > 0) {
          await supabase.from('milestones').insert(
            ct.milestones.map(m => ({
              contract_id:  contract.id,
              title:        m.title,
              description:  m.description,
              amount:       m.amount,
              order_index:  m.order_index,
              max_revisions:2,
            }))
          )
        }

        // Link contract to chat
        await supabase.from('chats')
          .update({ contract_id: contract.id })
          .eq('id', chat.id)

        // Colle announces and asks for escrow funding
        await supabase.from('messages').insert({
          chat_id: chat.id, sender_id: null,
          content: `✅ Both parties have signed! The contract "${ct.title}" is now active.\n\n💰 Next step: ${chat.client?.full_name || 'Client'}, please fund the escrow from your wallet so the freelancer can begin work. Go to Wallet → Fund Contract.`,
          type: 'colle',
        })
      }
    } else {
      // One party signed — notify
      const who = isClient ? 'Client' : 'Freelancer'
      await supabase.from('messages').insert({
        chat_id: chat.id, sender_id: null,
        content: `✍️ ${who} has signed. Waiting for the ${isClient ? 'freelancer' : 'client'} to sign before the contract is activated.`,
        type: 'system',
      })
    }
    setSigningPin('')
    setSigningMsgId(null)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main chat column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b ${c.border} flex-shrink-0 ${isDark ? 'bg-[#111]' : 'bg-white'}`}>
          {onBack && (
            <button onClick={onBack} className={`p-1.5 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#f0f0f0]'} md:hidden`}>
              <ArrowLeft size={16} className={c.text}/>
            </button>
          )}
          <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#f0f0f0]'} border ${c.border} flex items-center justify-center font-bold text-sm ${c.text} flex-shrink-0`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${c.text}`}>{partyName || 'Unknown'}</p>
            <p className={`text-xs ${c.muted}`}>{chat.contract?.title || chat.job?.title || 'Conversation'}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${c.border} text-xs font-bold`}>
              <Bot size={10} className={colleActive ? 'text-green-500' : c.muted}/>
              <span className={colleActive ? 'text-green-500' : c.muted}>Colle</span>
            </div>
            {/* Contract panel toggle */}
            <button onClick={() => setShowPanel(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all
                ${showPanel
                  ? 'border-green-500/30 bg-green-500/10 text-green-500'
                  : `${c.border} ${c.light} ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-[#f0f0f0]'}`}`}>
              <FileText size={11}/>
              <span className="hidden sm:inline">Contract</span>
              {showPanel ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : msgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
              <div className="text-4xl">👋</div>
              <div>
                <p className={`font-bold ${c.text}`}>Start the conversation</p>
                <p className={`text-xs ${c.muted} mt-1`}>
                  Type <span className="text-green-500 font-bold">Colle draft contract</span> when ready to formalise your agreement.
                </p>
              </div>
            </div>
          ) : msgs.map(m => (
            <MsgBubble
              key={m.id} msg={m} isDark={isDark} c={c} myId={myId}
              onSignContract={m.type === 'contract_draft' ? () => setSigningMsgId(m.id) : null}
            />
          ))}
          <div ref={bottomRef}/>
        </div>

        {/* Signing PIN modal */}
        {signingMsgId && (
          <div className={`mx-4 mb-3 p-4 rounded-xl border ${isDark ? 'border-blue-500/30 bg-blue-500/5' : 'border-blue-500/20 bg-blue-500/5'}`}>
            <p className={`text-xs font-bold text-blue-400 mb-2`}>✍️ Enter your signing password to sign</p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Your signing password"
                value={signingPin}
                onChange={e => setSigningPin(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { const msg = msgs.find(m => m.id === signingMsgId); if (msg) signContract(msg) }}}
                className={`flex-1 px-3 py-2 rounded-lg border text-xs outline-none ${isDark ? 'bg-[#1a1a1a] text-white border-[#2e2e2e] placeholder-[#444]' : 'bg-white text-[#0a0a0a] border-[#e0e0e0] placeholder-[#bbb]'}`}
              />
              <button
                onClick={() => { const msg = msgs.find(m => m.id === signingMsgId); if (msg) signContract(msg) }}
                className="px-3 py-2 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600">
                Sign
              </button>
              <button onClick={() => { setSigningMsgId(null); setSigningPin('') }}
                className={`px-3 py-2 rounded-lg text-xs font-bold ${c.bgMid} ${c.light}`}>
                Cancel
              </button>
            </div>
          </div>
        )}
        </div>

        {/* Scam warning */}
        {scamFlag && (
          <div className="mx-4 mb-3 flex items-start gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10">
            <AlertTriangle size={13} className="text-red-500 mt-0.5 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-xs font-bold text-red-500">⚠️ Off-platform payment detected</p>
              <p className="text-xs text-red-400 mt-0.5">This removes your escrow protection. Please edit your message.</p>
            </div>
            <button onClick={() => setScamFlag(false)}><X size={12} className="text-red-400"/></button>
          </div>
        )}

        {/* Colle typing */}
        {aiLoading && (
          <div className="flex items-center gap-2 px-6 py-2">
            <Bot size={12} className="text-green-500"/>
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}/>
              ))}
            </div>
            <span className="text-xs text-green-500 font-medium">Colle is thinking...</span>
          </div>
        )}

        {/* Input */}
        <div className={`flex items-center gap-2 px-4 py-3 border-t ${c.border} flex-shrink-0 ${isDark ? 'bg-[#111]' : 'bg-white'}`}>
          <input ref={fileRef} type="file" className="hidden" onChange={sendFile}/>
          <button onClick={() => fileRef.current?.click()}
            className={`p-2.5 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#f0f0f0]'} ${c.light} flex-shrink-0`}>
            <Paperclip size={15}/>
          </button>
          <button onClick={() => setInput('Colle')} title="Summon Colle"
            className="p-2.5 rounded-xl flex-shrink-0 bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20 transition-all">
            <Bot size={15}/>
          </button>
          <input type="text"
            placeholder='Message... or type "Colle" for AI help'
            value={input}
            onChange={e => { setInput(e.target.value); setScamFlag(false) }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
            className={`flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none transition-all
              ${isDark
                ? 'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e] focus:border-green-500/50'
                : 'bg-[#f8f8f8] text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0] focus:border-[#0a0a0a]'}`}/>
          <button onClick={sendMsg} disabled={!input.trim() || aiLoading}
            className={`p-2.5 rounded-xl flex-shrink-0 transition-all disabled:opacity-30
              ${isDark ? 'bg-white text-[#0a0a0a]' : 'bg-[#0a0a0a] text-white'}`}>
            <Send size={15}/>
          </button>
        </div>
      </div>

      {/* Contract + milestones side panel */}
      {showPanel && (
        <div className={`w-72 flex-shrink-0 border-l ${c.border} flex flex-col ${isDark ? 'bg-[#111]' : 'bg-white'} overflow-hidden`}>
          <div className={`flex items-center justify-between px-4 py-3 border-b ${c.border}`}>
            <div className="flex items-center gap-2">
              <FileText size={13} className={c.muted}/>
              <p className={`text-xs font-bold ${c.text}`}>Contract & Milestones</p>
            </div>
            <button onClick={() => setShowPanel(false)} className={c.muted}>
              <X size={14}/>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ContractPanel chatId={chat.id} isDark={isDark} c={c}/>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Notifications bell ─────────────────────────────────────
function NotificationsBell({ userId, isDark, c }) {
  const [notifs, setNotifs]     = useState([])
  const [open, setOpen]         = useState(false)
  const [unread, setUnread]     = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    fetchNotifs()
    // Real-time — listen to transactions and messages
    const ch = supabase.channel('notifs-' + userId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'transactions',
        filter: `user_id=eq.${userId}`
      }, () => fetchNotifs())
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages'
      }, () => fetchNotifs())
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'contracts'
      }, () => fetchNotifs())
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'milestones'
      }, () => fetchNotifs())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [userId])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchNotifs = async () => {
    const items = []

    // Recent transactions
    const { data: txs } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (txs) txs.forEach(tx => items.push({
      id: 'tx-' + tx.id,
      type: tx.type,
      text: tx.description || tx.type,
      time: tx.created_at,
      amount: tx.amount,
    }))

    // Recent milestone updates on user's contracts
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id')
      .or(`client_id.eq.${userId},freelancer_id.eq.${userId}`)

    if (contracts?.length > 0) {
      const contractIds = contracts.map(c => c.id)
      const { data: ms } = await supabase
        .from('milestones')
        .select('*, contract:contracts(title)')
        .in('contract_id', contractIds)
        .in('status', ['submitted', 'approved', 'paid'])
        .order('updated_at', { ascending: false })
        .limit(5)

      if (ms) ms.forEach(m => items.push({
        id: 'ms-' + m.id,
        type: 'milestone',
        text: `Milestone "${m.title}" is ${m.status} — ${m.contract?.title || 'contract'}`,
        time: m.updated_at || m.created_at,
      }))
    }

    // Sort by time
    items.sort((a, b) => new Date(b.time) - new Date(a.time))
    setNotifs(items.slice(0, 10))
    setUnread(items.filter(n => {
      const age = (Date.now() - new Date(n.time)) / 1000 / 60
      return age < 60 // unread = last hour
    }).length)
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(p => !p)}
        className={`relative w-9 h-9 rounded-full border flex items-center justify-center transition-all
          ${open
            ? 'border-green-500/30 bg-green-500/10 text-green-500'
            : `${c.border} ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#f0f0f0]'} ${c.light}`}`}>
        <Bell size={15}/>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute right-0 top-11 w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden
          ${isDark ? 'bg-[#111] border-[#2e2e2e]' : 'bg-white border-[#e0e0e0]'}`}>
          <div className={`flex items-center justify-between px-4 py-3 border-b ${c.border}`}>
            <p className={`text-sm font-bold ${c.text}`}>Notifications</p>
            {unread > 0 && (
              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">
                {unread} new
              </span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y" style={{ borderColor: isDark ? '#2e2e2e' : '#e8e8e8' }}>
            {notifs.length > 0 ? notifs.map(n => (
              <div key={n.id} className={`flex items-start gap-3 px-4 py-3 transition-colors
                ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-[#f8f8f8]'}`}>
                <span className="text-base flex-shrink-0 mt-0.5">{notifIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${c.text} leading-relaxed`}>{n.text}</p>
                  <p className={`text-xs ${c.muted} mt-0.5`}>{timeAgo(n.time)}</p>
                </div>
                {n.amount && (
                  <p className="text-xs font-bold text-green-500 flex-shrink-0">
                    ₦{n.amount?.toLocaleString()}
                  </p>
                )}
              </div>
            )) : (
              <div className="py-10 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className={`text-xs ${c.muted}`}>No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
export default function Messages() {
  const { theme, toggle } = useTheme()
  const { user, displayName, isFreelancer } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isDark = theme === 'dark'

  const [chats, setChats]       = useState([])
  const [jobs, setJobs]         = useState([])
  const [selected, setSelected] = useState(null)
  const [mobileView, setMobileView] = useState('list')
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)

  const c = {
    bg:      isDark ? 'bg-[#0a0a0a]'     : 'bg-[#f8f8f8]',
    card:    isDark ? 'bg-[#111]'        : 'bg-white',
    bgMid:   isDark ? 'bg-[#1a1a1a]'     : 'bg-[#f0f0f0]',
    bgAcc:   isDark ? 'bg-[#242424]'     : 'bg-[#e8e8e8]',
    border:  isDark ? 'border-[#2e2e2e]' : 'border-[#e0e0e0]',
    text:    isDark ? 'text-white'       : 'text-[#0a0a0a]',
    muted:   isDark ? 'text-[#555]'      : 'text-[#aaa]',
    light:   isDark ? 'text-[#888]'      : 'text-[#666]',
    divider: isDark ? 'bg-[#2e2e2e]'     : 'bg-[#e0e0e0]',
    input:   isDark
      ? 'bg-[#1a1a1a] text-white placeholder-[#444] border-[#2e2e2e]'
      : 'bg-[#f8f8f8] text-[#0a0a0a] placeholder-[#bbb] border-[#e0e0e0]',
  }

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchChats()
    if (isFreelancer) fetchJobs()
  }, [user, isFreelancer])

  useEffect(() => {
    const contractId = searchParams.get('contract')
    const jobId = searchParams.get('job')
    if ((contractId || jobId) && chats.length > 0) {
      const match = chats.find(ch => ch.contract_id === contractId || ch.job_id === jobId)
      if (match) { setSelected(match); setMobileView('chat') }
    }
  }, [searchParams, chats])

  const fetchChats = async () => {
    const { data } = await supabase
      .from('chats')
      .select(`
        *,
        client:users!chats_client_id_fkey(id, full_name, trust_score),
        freelancer:users!chats_freelancer_id_fkey(id, full_name, trust_score),
        contract:contracts(id, title, status, total_value),
        job:jobs(id, title, budget_min, budget_max, description, brief_url, brief_name, client_id)
      `)
      .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (data) {
      const withLast = await Promise.all(data.map(async ch => {
        const { data: lm } = await supabase
          .from('messages')
          .select('content, created_at, type')
          .eq('chat_id', ch.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        return { ...ch, lastMessage: lm }
      }))
      setChats(withLast)
    }
    setLoading(false)
  }

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*, client:users!jobs_client_id_fkey(full_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setJobs(data)
  }

  const filtered = chats.filter(ch => {
    const party = user.id === ch.client_id ? ch.freelancer : ch.client
    const name = party?.full_name || ''
    const title = ch.contract?.title || ch.job?.title || ''
    return name.toLowerCase().includes(search.toLowerCase()) ||
           title.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className={`h-screen flex flex-col transition-colors duration-300 ${c.bg}`}>

      {/* Header */}
      <header className={`flex items-center justify-between px-6 py-4 border-b ${c.border} ${c.card} flex-shrink-0`}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className={`flex items-center gap-2 text-sm font-semibold ${c.light}`}>
            <ArrowLeft size={15}/> Dashboard
          </Link>
          <div className={`w-px h-4 ${c.divider}`}/>
          <span className={`text-sm font-bold ${c.text}`}>Messages</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${c.border} text-xs font-bold ${c.muted}`}>
            <Bot size={11} className="text-green-500"/> Colle Active
          </div>
          {/* Notifications bell */}
          {user && <NotificationsBell userId={user.id} isDark={isDark} c={c}/>}
          <button onClick={toggle}
            className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm
              ${isDark ? 'border-[#2e2e2e] bg-[#1a1a1a]' : 'border-[#e0e0e0] bg-[#f0f0f0]'}`}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Left panel */}
        <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r ${c.border} ${c.card} flex flex-col
          ${mobileView === 'chat' ? 'hidden md:flex' : ''}`}>

          {/* Freelancer job alerts */}
          {isFreelancer && jobs.length > 0 && (
            <div className={`border-b ${c.border} ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#f8f8f8]'}`}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bell size={13} className="text-green-500"/>
                  <span className={`text-xs font-bold ${c.text}`}>Job Alerts</span>
                  <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                    {jobs.length}
                  </span>
                </div>
                <Link to="/jobs" className="text-xs text-green-500 font-bold hover:underline">See all</Link>
              </div>
              <div className="px-3 pb-3 space-y-2">
                {jobs.slice(0, 3).map(job => (
                  <Link key={job.id} to="/jobs"
                    className={`flex items-center gap-3 p-3 rounded-xl border ${c.border} transition-all
                      ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-white'} block`}>
                    <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#f0f0f0]'} border ${c.border} flex items-center justify-center flex-shrink-0`}>
                      <Briefcase size={12} className={c.muted}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${c.text}`}>{job.title}</p>
                      <p className={`text-xs ${c.muted}`}>
                        ₦{job.budget_min?.toLocaleString()} – ₦{job.budget_max?.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className={`px-4 py-3 border-b ${c.border}`}>
            <div className="relative">
              <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c.muted}`}/>
              <input type="text" placeholder="Search conversations..."
                value={search} onChange={e => setSearch(e.target.value)}
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none ${c.input}`}/>
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : filtered.length > 0 ? filtered.map(ch => {
              const party = user.id === ch.client_id ? ch.freelancer : ch.client
              const name = party?.full_name || 'Unknown'
              const initials = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
              const title = ch.contract?.title || ch.job?.title || 'Conversation'
              const lm = ch.lastMessage

              return (
                <button key={ch.id}
                  onClick={() => { setSelected(ch); setMobileView('chat') }}
                  className={`w-full flex items-start gap-3 px-4 py-4 text-left border-b ${c.border} transition-colors
                    ${selected?.id === ch.id
                      ? isDark ? 'bg-[#1a1a1a]' : 'bg-[#f0f0f0]'
                      : isDark ? 'hover:bg-[#111]' : 'hover:bg-[#f8f8f8]'}`}>
                  <div className={`w-11 h-11 rounded-xl ${c.bgAcc} border ${c.border} flex items-center justify-center font-bold text-sm ${c.text} flex-shrink-0`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-bold truncate ${c.text}`}>{name}</p>
                      {lm && <span className={`text-xs flex-shrink-0 ${c.muted}`}>{timeAgo(lm.created_at)}</span>}
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${c.muted}`}>{title}</p>
                    {lm && (
                      <p className={`text-xs truncate mt-1 ${c.light}`}>
                        {lm.type === 'colle' ? '🤖 Colle responded'
                          : lm.type === 'file' ? '📎 File shared'
                          : lm.type === 'system' ? '🔔 ' + lm.content
                          : lm.content}
                      </p>
                    )}
                    {ch.contract && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Lock size={9} className="text-green-500"/>
                        <span className="text-xs text-green-500 font-medium">
                          ₦{ch.contract.total_value?.toLocaleString()} escrow
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              )
            }) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className={`font-bold text-sm ${c.text}`}>No conversations yet</p>
                <p className={`text-xs ${c.muted} mt-1`}>
                  {isFreelancer ? 'Apply for a job to start chatting with a client.' : 'Post a job or create a contract to connect.'}
                </p>
                <Link to={isFreelancer ? '/jobs' : '/contracts/new'}
                  className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all
                    ${isDark ? 'bg-white text-[#0a0a0a]' : 'bg-[#0a0a0a] text-white'}`}>
                  <Plus size={12}/>
                  {isFreelancer ? 'Find Jobs' : 'New Contract'}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col overflow-hidden ${c.bg} ${mobileView === 'list' ? 'hidden md:flex' : ''}`}>
          {selected ? (
            <ChatView
              chat={selected}
              isDark={isDark}
              c={c}
              onBack={() => setMobileView('list')}
              myId={user.id}
              displayName={displayName}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
              <div className={`w-16 h-16 rounded-2xl ${c.card} border ${c.border} flex items-center justify-center`}>
                <Bot size={28} className="text-green-500"/>
              </div>
              <div>
                <p className={`font-bold ${c.text}`}>Select a conversation</p>
                <p className={`text-sm ${c.muted} mt-1 max-w-xs`}>
                  Type <span className="text-green-500 font-bold">Colle</span> in any chat for AI contract assistance.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
