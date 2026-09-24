import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  ArrowRight, ArrowUpRight, BookOpenText, Check, ChevronDown, CircleHelp,
  FilePenLine, Infinity as InfinityIcon, LoaderCircle, LogOut, Plus,
  Search, Trash2, X,
} from 'lucide-react'
import {
  createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail,
  signInWithEmailAndPassword, signOut, type User,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { MarkdownContent, MarkdownExcerpt } from './MarkdownContent'
import { filterNotes, matchesSubjectName, noteDate, SUBJECTS, type Note, type Subject, type SubjectFilter } from './notes'

type NoteDraft = Pick<Note, 'title' | 'content' | 'subject' | 'className'>

function authMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) return 'Não foi possível concluir agora. Tente novamente.'
  if (error.code === 'auth/email-already-in-use') return 'Esse e-mail já tem conta. Entre com sua senha.'
  if (error.code === 'auth/weak-password') return 'Crie uma senha com pelo menos 6 caracteres.'
  if (error.code === 'auth/invalid-email') return 'Confira o endereço de e-mail.'
  if (error.code === 'auth/network-request-failed') return 'Sem conexão com o Firebase. Tente novamente.'
  if (error.code === 'auth/too-many-requests') return 'Muitas tentativas seguidas. Aguarde um pouco e tente novamente.'
  return 'E-mail ou senha não conferem. Tente de novo.'
}

function Brand() {
  return (
    <div className="brand" aria-label="Caderno Infinito">
      <span className="brand-symbol"><InfinityIcon size={25} strokeWidth={2.5} /></span>
      <span>Caderno <strong>Infinito</strong><small>um espaço da Tech-2D</small></span>
    </div>
  )
}

function AuthDialog({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (mode === 'register') await createUserWithEmailAndPassword(auth, email.trim(), password)
      else await signInWithEmailAndPassword(auth, email.trim(), password)
      setPassword('')
    } catch (cause) {
      setError(authMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  async function recoverPassword() {
    if (!email.trim()) {
      setError('Digite seu e-mail para receber o link de recuperação.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setNotice('Se esse e-mail tiver uma conta, enviaremos um link para redefinir a senha.')
    } catch {
      setError('Não conseguimos enviar o link agora. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <section className="auth-card auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <div className="modal-top auth-dialog-top"><span className="eyebrow">ACESSO PARA PUBLICAR</span><button type="button" className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20} /></button></div>
          <span className="auth-card-icon"><BookOpenText size={24} /></span>
          <h2 id="auth-title">{mode === 'login' ? 'Entrar no caderno' : 'Criar conta'}</h2>
          <p>{mode === 'login' ? 'Entre para publicar suas anotações.' : 'Crie uma conta para compartilhar suas anotações.'}</p>
          <form onSubmit={submit}>
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required autoFocus />
            <label htmlFor="password">Senha</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 6 : undefined} required />
            {error && <p className="form-error" role="alert">{error}</p>}
            {notice && <p className="form-notice" role="status">{notice}</p>}
            <button className="primary-button auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : mode === 'login' ? <>Entrar no caderno <ArrowRight size={18} /></> : <>Criar conta <ArrowRight size={18} /></>}</button>
          </form>
          <div className="auth-card-links">
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setNotice('') }}>{mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho conta'}</button>
            {mode === 'login' && <button type="button" onClick={recoverPassword} disabled={busy}>Esqueci a senha</button>}
          </div>
          <div className="auth-foot"><CircleHelp size={16} /><span>A leitura é livre. Para publicar, entre com sua conta; só o autor pode editar.</span></div>
        </section>
    </div>
  )
}

function NoteCard({ note, onOpen }: { note: Note; onOpen: () => void }) {
  return (
    <button type="button" className="note-card" onClick={onOpen} aria-label={`Ler anotação: ${note.title}`}>
      <span className="note-card-top"><span className="subject-pill">{note.subject}</span><ArrowUpRight size={18} /></span>
      <strong>{note.title}</strong>
      <MarkdownExcerpt content={note.content} />
      <span className="note-card-bottom"><span>{note.className || 'Sem turma'} · {note.authorEmail}</span><time>{noteDate(note.updatedAt)}</time></span>
    </button>
  )
}

function NoteDetail({ note, canEdit, onClose, onEdit, onDelete }: {
  note: Note; canEdit: boolean; onClose: () => void; onEdit: () => void; onDelete: () => void
}) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <article className="detail-sheet" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <div className="modal-top"><span className="eyebrow">PÁGINA DO CADERNO</span><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20} /></button></div>
        <span className="subject-pill">{note.subject}</span>
        <h2 id="detail-title">{note.title}</h2>
        <div className="detail-meta">{note.className || 'Sem turma'} <span>·</span> {note.authorEmail} <span>·</span> {noteDate(note.updatedAt)}</div>
        <div className="detail-content"><MarkdownContent content={note.content} /></div>
        <div className="detail-actions">
          {canEdit && <><button type="button" className="secondary-button" onClick={onEdit}><FilePenLine size={17} /> Editar</button><button type="button" className="danger-button" onClick={onDelete}><Trash2 size={17} /> Apagar</button></>}
          <button type="button" className="text-button" onClick={onClose}>Voltar ao caderno</button>
        </div>
      </article>
    </div>
  )
}

function NoteEditor({ note, onClose, onSave }: { note: Note | null; onClose: () => void; onSave: (draft: NoteDraft) => Promise<void> }) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [subject, setSubject] = useState<Subject>(note?.subject ?? 'Matemática')
  const [className, setClassName] = useState(note?.className ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const editorSubjects = note && !SUBJECTS.some((item) => item === note.subject) ? [note.subject, ...SUBJECTS] : SUBJECTS

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('Preencha o título e a anotação.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSave({ title: title.trim(), content: content.trim(), subject, className: className.trim() })
      onClose()
    } catch {
      setError('Não foi possível salvar a anotação. Confira a conexão e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="editor-sheet" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <div className="modal-top"><span className="eyebrow">{note ? 'EDITAR PÁGINA' : 'NOVA PÁGINA'}</span><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20} /></button></div>
        <h2 id="editor-title">{note ? 'Ajuste sua anotação' : 'O que você descobriu?'}</h2>
        <p>Uma explicação clara ajuda a próxima pessoa a entender de primeira.</p>
        <form onSubmit={submit}>
          <div className="editor-row">
            <label>Matéria<select value={subject} onChange={(event) => setSubject(event.target.value as Subject)}>{editorSubjects.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></label>
            <label>Turma <span>(opcional)</span><input value={className} onChange={(event) => setClassName(event.target.value)} placeholder="Ex.: 2º D" maxLength={32} /></label>
          </div>
          <label>Título<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Função do 2º grau" maxLength={120} required autoFocus /></label>
          <div className="editor-body-field">
            <div className="editor-body-header"><label htmlFor="note-content">Anotação</label><div className="editor-view-switch" aria-label="Modo de edição"><button type="button" aria-pressed={!showPreview} onClick={() => setShowPreview(false)}>Escrever</button><button type="button" aria-pressed={showPreview} onClick={() => setShowPreview(true)}>Prévia</button></div></div>
            {showPreview ? <div className="editor-preview" role="region" aria-label="Prévia da anotação">{content.trim() ? <MarkdownContent content={content} /> : <p className="preview-empty">Escreva algo para ver a prévia.</p>}</div> : <textarea id="note-content" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Escreva sua anotação em Markdown..." maxLength={5000} rows={10} required />}
            <p className="markdown-help">Use <code>**negrito**</code>, <code># título</code>, <code>- lista</code> e <code>[link](URL)</code>.</p>
          </div>
          <span className="editor-count">{content.length} / 5000 caracteres</span>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="editor-actions"><button type="button" className="text-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : <><Check size={18} /> {note ? 'Salvar alterações' : 'Publicar anotação'}</>}</button></div>
        </form>
      </section>
    </div>
  )
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [subject, setSubject] = useState<SubjectFilter>('Todas')
  const [subjectQuery, setSubjectQuery] = useState('')
  const [search, setSearch] = useState('')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorNote, setEditorNote] = useState<Note | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const pendingNewNote = useRef(false)

  useEffect(() => onAuthStateChanged(auth, (account) => {
    setUser(account)
    setAuthReady(true)
    if (account) {
      setAuthOpen(false)
      if (pendingNewNote.current) {
        pendingNewNote.current = false
        setEditorNote(null)
        setEditorOpen(true)
      }
    }
  }), [])

  useEffect(() => {
    return onSnapshot(collection(db, 'notebookNotes'), (snapshot) => {
      setNotes(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Note))
      setLoading(false)
      setLoadError('')
    }, () => {
      setLoading(false)
      setLoadError('Não foi possível carregar as anotações. Confira a conexão e tente novamente.')
    })
  }, [])

  const visibleNotes = useMemo(() => filterNotes(notes, subject, search), [notes, subject, search])
  const availableSubjects = useMemo(() => [...new Set<string>([...SUBJECTS, ...notes.map((note) => note.subject)])], [notes])
  const matchingSubjects = useMemo(() => availableSubjects.filter((item) => matchesSubjectName(item, subjectQuery)), [availableSubjects, subjectQuery])
  const subjectCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const note of notes) counts.set(note.subject, (counts.get(note.subject) ?? 0) + 1)
    return counts
  }, [notes])
  const myNotes = notes.filter((note) => note.authorUid === user?.uid).length

  function openEditor(note: Note | null = null) {
    if (!user) {
      pendingNewNote.current = true
      setAuthOpen(true)
      return
    }
    setEditorNote(note)
    setSelectedNote(null)
    setEditorOpen(true)
  }

  async function saveNote(draft: NoteDraft) {
    const account = auth.currentUser
    if (!account?.email) throw new Error('Sessão expirada')
    if (editorNote) {
      await updateDoc(doc(db, 'notebookNotes', editorNote.id), { ...draft, updatedAt: serverTimestamp() })
    } else {
      await addDoc(collection(db, 'notebookNotes'), {
        ...draft, authorUid: account.uid, authorEmail: account.email,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    }
  }

  async function removeNote(note: Note) {
    if (!user || note.authorUid !== user.uid) return
    if (!window.confirm(`Apagar “${note.title}” do caderno? Essa ação não pode ser desfeita.`)) return
    setActionError('')
    try {
      await deleteDoc(doc(db, 'notebookNotes', note.id))
      setSelectedNote(null)
    } catch {
      setActionError('Não foi possível apagar a anotação. Tente novamente.')
    }
  }

  if (!authReady) return <div className="boot-screen"><LoaderCircle className="spin" size={25} /><span>Abrindo o caderno…</span></div>

  return (
    <div className="app-shell">
      <header className="topbar"><Brand /><div className="topbar-actions">{user ? <><span className="account-email" title={user.email ?? ''}>{user.email}</span><button type="button" className="signout-button" onClick={() => signOut(auth)} aria-label="Sair da conta" title="Sair"><LogOut size={18} /></button></> : <button type="button" className="signin-button" onClick={() => setAuthOpen(true)}>Entrar</button>}</div></header>
      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-heading"><span>SEU ESPAÇO</span><strong>Explore o caderno</strong></div>
          <label className="subject-search"><Search size={16} /><input type="search" value={subjectQuery} onChange={(event) => setSubjectQuery(event.target.value)} placeholder="Buscar matéria" aria-label="Buscar matéria" /></label>
          <nav aria-label="Filtrar por matéria" className="subject-list">
            {(['Todas', ...matchingSubjects] as SubjectFilter[]).map((item) => (
              <button key={item} type="button" className={subject === item ? 'selected' : ''} onClick={() => setSubject(item)} aria-current={subject === item ? 'page' : undefined}>
                <span className="subject-dot" /><span>{item === 'Todas' ? 'Todas as notas' : item}</span><small>{item === 'Todas' ? notes.length : subjectCounts.get(item) ?? 0}</small>
              </button>
            ))}
            {subjectQuery && matchingSubjects.length === 0 && <p className="subject-no-match">Nenhuma matéria encontrada.</p>}
          </nav>
          <div className="sidebar-bottom">{user ? <div className="sidebar-stat"><strong>{myNotes.toString().padStart(2, '0')}</strong><span>anotações<br />escritas por você</span></div> : <p className="sidebar-public-note">Leia à vontade. Entre para publicar uma anotação.</p>}<div className="other-apps"><span>OUTROS ESPAÇOS</span><a href="https://tech-2d.github.io/Agenda/" target="_blank" rel="noopener noreferrer">Agenda <ArrowUpRight size={15} /></a><a href="https://tech-2d.github.io/professores/" target="_blank" rel="noopener noreferrer">Cadê o professor? <ArrowUpRight size={15} /></a></div></div>
        </aside>
        <main className="main-content">
          <div className="page-intro"><h1>Anotações</h1><p>{user ? 'Encontre ou compartilhe uma anotação.' : 'Leia livremente. Entre para compartilhar as suas anotações.'}</p></div>
          <div className="toolbar"><label className="search-box"><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar assunto, palavra ou turma" aria-label="Buscar anotações" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca"><X size={17} /></button>}</label><button className="primary-button add-button" onClick={() => openEditor()}><Plus size={19} /> Nova anotação</button></div>
          <label className="mobile-subjects">Matéria<select value={subject} onChange={(event) => setSubject(event.target.value)}><option value="Todas">Todas as matérias</option>{availableSubjects.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></label>
          <div className="list-heading"><div><BookOpenText size={20} /><h2>{subject === 'Todas' ? 'Todas as páginas' : subject}</h2></div><span>{visibleNotes.length} {visibleNotes.length === 1 ? 'anotação' : 'anotações'}</span></div>
          {actionError && <div className="notice error" role="alert">{actionError}<button onClick={() => setActionError('')} aria-label="Fechar aviso"><X size={16} /></button></div>}
          {loadError && <div className="notice error" role="alert">{loadError}</div>}
          {loading ? <div className="empty-state"><LoaderCircle className="spin" size={26} /><p>Procurando anotações…</p></div> : visibleNotes.length === 0 ? <div className="empty-state"><span className="empty-icon"><FilePenLine size={30} /></span><h3>{notes.length === 0 ? 'A primeira página espera por você.' : 'Nenhuma anotação por aqui.'}</h3><p>{notes.length === 0 ? 'Publique uma ideia, um resumo ou uma explicação para começar o caderno.' : 'Tente outra palavra ou matéria para encontrar mais páginas.'}</p><button className="secondary-button" onClick={() => notes.length === 0 ? openEditor() : (setSearch(''), setSubject('Todas'))}>{notes.length === 0 ? (user ? 'Escrever a primeira anotação' : 'Entrar para escrever') : 'Limpar filtros'}</button></div> : <div className="notes-grid">{visibleNotes.map((note) => <NoteCard key={note.id} note={note} onOpen={() => setSelectedNote(note)} />)}</div>}
          <footer><span>Caderno Infinito · protótipo da Tech-2D</span><span>Feito para compartilhar o que aprendemos.</span></footer>
        </main>
      </div>
      {selectedNote && <NoteDetail note={selectedNote} canEdit={selectedNote.authorUid === user?.uid} onClose={() => setSelectedNote(null)} onEdit={() => openEditor(selectedNote)} onDelete={() => removeNote(selectedNote)} />}
      {editorOpen && user && <NoteEditor note={editorNote} onClose={() => setEditorOpen(false)} onSave={saveNote} />}
      {authOpen && !user && <AuthDialog onClose={() => { pendingNewNote.current = false; setAuthOpen(false) }} />}
    </div>
  )
}

export default App
