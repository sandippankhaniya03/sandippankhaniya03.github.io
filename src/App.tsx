import { useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'

type ArrowProps = { diagonal?: boolean }

function Arrow({ diagonal = false }: ArrowProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="arrow-icon">
      {diagonal ? (
        <path d="M5 15 15 5M6 5h9v9" />
      ) : (
        <path d="M3.5 10h12m-5-5 5 5-5 5" />
      )}
    </svg>
  )
}

function Header() {
  const navRef = useRef<HTMLElement>(null)
  const linkRefs = useRef<Partial<Record<string, HTMLAnchorElement | null>>>({})
  const [activeLink, setActiveLink] = useState<string | null>(null)
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  const [focusedLink, setFocusedLink] = useState<string | null>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const highlightedLink = hoveredLink ?? focusedLink ?? activeLink
  const navLinks = [
    { id: 'about', label: 'About' },
    { id: 'toolkit', label: 'Toolkit' },
    { id: 'direction', label: 'Direction' },
    { id: 'contact', label: 'Contact' },
  ]

  useLayoutEffect(() => {
    const nav = navRef.current
    const link = highlightedLink ? linkRefs.current[highlightedLink] : null
    if (!nav || !link) return

    const measure = () => {
      const navBounds = nav.getBoundingClientRect()
      const linkBounds = link.getBoundingClientRect()
      setIndicator({
        left: linkBounds.left - navBounds.left - 9,
        width: linkBounds.width + 18,
      })
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [highlightedLink])

  useLayoutEffect(() => {
    const observedSections = navLinks
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null)
    if (!('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]?.target.id) setActiveLink(visible[0].target.id)
    }, { rootMargin: '-22% 0px -64% 0px', threshold: 0 })

    observedSections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="wordmark" href="#top" aria-label="Sandip Pankhaniya, home">
          <span className="wordmark-mark">S<span>.</span></span>
          <span className="wordmark-name">Sandip Pankhaniya</span>
        </a>
        <nav
          ref={navRef}
          className={`main-nav${highlightedLink ? ' has-liquid' : ''}`}
          aria-label="Main navigation"
          onPointerLeave={() => setHoveredLink(null)}
          onBlurCapture={(event) => {
            const nextTarget = event.relatedTarget
            if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) setFocusedLink(null)
          }}
        >
          <span
            className="nav-liquid"
            aria-hidden="true"
            style={{ left: `${indicator.left}px`, width: `${indicator.width}px` }}
          />
          {navLinks.map(({ id, label }) => (
            <a
              key={id}
              ref={(element) => { linkRefs.current[id] = element }}
              href={`#${id}`}
              className={`${id === 'contact' ? 'nav-contact' : ''}${highlightedLink === id ? ' is-highlighted' : ''}`}
              onPointerEnter={() => setHoveredLink(id)}
              onFocus={() => setFocusedLink(id)}
              onClick={() => setActiveLink(id)}
            >
              {label}{id === 'contact' && <> <Arrow diagonal /></>}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

type DiagramNodeId = 'ui' | 'llm' | 'rag' | 'api'
type DiagramPoint = { x: number; y: number }

const initialNodePositions: Record<DiagramNodeId, DiagramPoint> = {
  ui: { x: 86, y: 104 },
  llm: { x: 396, y: 88 },
  rag: { x: 124, y: 299 },
  api: { x: 368, y: 299 },
}

const diagramNodeLabels: Record<DiagramNodeId, string> = {
  ui: 'User interface',
  llm: 'Large language model',
  rag: 'Retrieval augmented generation',
  api: 'Backend API',
}

const diagramNodeIds: DiagramNodeId[] = ['ui', 'llm', 'rag', 'api']

function SignalGraphic() {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ id: DiagramNodeId; pointerId: number; offsetX: number; offsetY: number } | null>(null)
  const [nodes, setNodes] = useState(initialNodePositions)
  const [dragging, setDragging] = useState<DiagramNodeId | null>(null)

  const toCanvasPoint = (clientX: number, clientY: number): DiagramPoint | null => {
    const bounds = svgRef.current?.getBoundingClientRect()
    if (!bounds || bounds.width === 0 || bounds.height === 0) return null
    return {
      x: ((clientX - bounds.left) / bounds.width) * 500,
      y: ((clientY - bounds.top) / bounds.height) * 390,
    }
  }

  const startDrag = (id: DiagramNodeId, event: ReactPointerEvent<SVGGElement>) => {
    const point = toCanvasPoint(event.clientX, event.clientY)
    const svg = svgRef.current
    if (!point || !svg) return
    event.preventDefault()
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      offsetX: nodes[id].x - point.x,
      offsetY: nodes[id].y - point.y,
    }
    svg.setPointerCapture(event.pointerId)
    setDragging(id)
  }

  const moveNode = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const point = toCanvasPoint(event.clientX, event.clientY)
    if (!point) return
    const x = Math.min(466, Math.max(34, point.x + drag.offsetX))
    const y = Math.min(352, Math.max(38, point.y + drag.offsetY))
    setNodes((current) => ({ ...current, [drag.id]: { x, y } }))
  }

  const finishDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    setDragging(null)
  }

  const moveByKeyboard = (id: DiagramNodeId, event: ReactKeyboardEvent<SVGGElement>) => {
    const step = event.shiftKey ? 16 : 8
    const offsets: Record<string, DiagramPoint> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    }
    const offset = offsets[event.key]
    if (offset) {
      event.preventDefault()
      setNodes((current) => ({
        ...current,
        [id]: {
          x: Math.min(466, Math.max(34, current[id].x + offset.x)),
          y: Math.min(352, Math.max(38, current[id].y + offset.y)),
        },
      }))
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setNodes((current) => ({ ...current, [id]: initialNodePositions[id] }))
    }
  }

  return (
    <div className="signal-card">
      <div className="signal-topline">
        <span>APPLICATION SYSTEMS</span>
        <span className="signal-live"><i /> DRAG TO EXPLORE</span>
      </div>
      <svg
        ref={svgRef}
        className="system-map"
        viewBox="0 0 500 390"
        role="group"
        aria-labelledby="map-title map-description"
        onPointerMove={moveNode}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <title id="map-title">From user input to useful AI products</title>
        <desc id="map-description">An interactive diagram. Drag the user interface, language model, retrieval, and backend API nodes with a pointer. Focus a node and use the arrow keys to move it, or press Enter to reset it.</desc>
        <defs>
          <linearGradient id="line-gradient" x1=".1" y1=".1" x2=".9" y2=".9">
            <stop offset="0" stopColor="#bef264" stopOpacity=".8" />
            <stop offset="1" stopColor="#82a967" stopOpacity=".12" />
          </linearGradient>
          <radialGradient id="core-glow">
            <stop stopColor="#bef264" stopOpacity=".18" />
            <stop offset="1" stopColor="#bef264" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="265" cy="190" r="135" fill="url(#core-glow)" />
        {diagramNodeIds.map((id) => (
          <path className="map-line" key={`connection-${id}`} d={`M${nodes[id].x} ${nodes[id].y} L245 184`} />
        ))}
        <circle className="map-pulse-ring" cx="245" cy="184" r="45" />
        <circle className="map-node map-node-main" cx="245" cy="184" r="42" />
        <circle className="map-node-core" cx="245" cy="184" r="5" />
        {diagramNodeIds.map((id) => (
          <g
            className={`draggable-node${dragging === id ? ' is-dragging' : ''}`}
            key={id}
            transform={`translate(${nodes[id].x} ${nodes[id].y})`}
            role="button"
            tabIndex={0}
            aria-label={`${diagramNodeLabels[id]} node. Drag to move, use arrow keys to reposition, or press Enter to reset.`}
            onPointerDown={(event) => startDrag(id, event)}
            onKeyDown={(event) => moveByKeyboard(id, event)}
          >
            <circle className="map-node" r="27" />
            <text y="4" textAnchor="middle">{id.toUpperCase()}</text>
          </g>
        ))}
        <text className="map-center-label" x="245" y="181" textAnchor="middle">USEFUL</text>
        <text className="map-center-label" x="245" y="197" textAnchor="middle">PRODUCTS</text>
        <circle className="map-spark" cx="314" cy="136" r="3" />
        <circle className="map-spark map-spark-2" cx="173" cy="244" r="2" />
      </svg>
      <div className="signal-caption">
        <span>{dragging ? `Moving ${dragging.toUpperCase()}` : 'Drag a node to explore'}</span>
        <span className="caption-rule" />
        <span>Arrow keys move · Enter resets</span>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="hero container" id="top" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-line" /> AI ENGINEERING <span className="eyebrow-divider">/</span> BACKEND</p>
        <h1 id="hero-title">Making AI<br />useful in the <span className="serif-accent">real world.</span></h1>
        <p className="hero-summary">
          I’m <strong>Sandip Pankhaniya</strong>, a Python developer building toward AI and backend engineering. I’m interested in turning language models and thoughtful systems into products people can rely on.
        </p>
        <div className="hero-actions flex flex-wrap items-center">
          <a className="button button-primary" href="mailto:psandip2806@gmail.com">Let’s talk <Arrow diagonal /></a>
          <a className="button button-quiet" href="https://github.com/sandippankhaniya03" target="_blank" rel="noreferrer">View GitHub <Arrow diagonal /></a>
        </div>
        <p className="availability"><span className="availability-dot" /> Open to product-focused opportunities <span className="availability-separator">·</span> Remote across time zones</p>
      </div>
      <div className="hero-visual"><SignalGraphic /></div>
      <a className="scroll-cue" href="#about"><span /> SCROLL TO EXPLORE</a>
    </section>
  )
}

function SectionHeading({ index, eyebrow, title, children, id }: { index: string; eyebrow: string; title: string; children?: ReactNode; id?: string }) {
  return (
    <div className="section-heading">
      <div className="section-heading-top"><span>{index}</span><span className="section-eyebrow">{eyebrow}</span></div>
      <h2 id={id}>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  )
}

const focusAreas = [
  {
    number: '01',
    title: 'AI applications',
    text: 'Exploring LLM-powered experiences, retrieval-augmented generation, embeddings, and agent workflows.',
    tags: ['LLMs', 'RAG', 'Embeddings', 'Agents'],
  },
  {
    number: '02',
    title: 'Backend systems',
    text: 'Learning to shape clear APIs and dependable services that give intelligent products a solid foundation.',
    tags: ['Python', 'REST APIs', 'Data'],
  },
  {
    number: '03',
    title: 'Product engineering',
    text: 'Thinking about the full experience: the user problem, system design, failure modes, and the details that build trust.',
    tags: ['System design', 'Evaluation', 'Reliability'],
  },
]

function About() {
  return (
    <section className="section about-section" id="about" aria-labelledby="about-title">
      <div className="container section-grid">
        <SectionHeading index="01" eyebrow="A little about me" title="Curious by nature.\nProduct-minded by choice." id="about-title" />
        <div className="about-content">
          <p className="about-lead">I like technology most when it makes something difficult feel simple.</p>
          <p>I’m developing my path across AI engineering and backend development, with Python and generative AI at the center. I’m especially drawn to the work between a promising model and a product that is actually useful: retrieval, APIs, evaluation, and the care put into the whole system.</p>
          <p>I value strong fundamentals, clear code, and teams that pair thoughtful experimentation with a bias toward building.</p>
          <div className="about-note"><span className="note-mark">↳</span><span>Currently interested in early-stage teams solving meaningful problems with software.</span></div>
        </div>
      </div>
    </section>
  )
}

function Interests() {
  return (
    <section className="section interests-section" id="interests" aria-labelledby="interests-title">
      <div className="container">
        <SectionHeading index="04" eyebrow="Questions I’m exploring" title="Technical curiosity,\npractical intent." id="interests-title" />
        <div className="focus-grid grid grid-cols-3">
          {focusAreas.map((area) => (
            <article className="focus-card flex flex-col" key={area.number}>
              <div className="focus-card-top"><span>{area.number}</span><span className="focus-indicator" /></div>
              <h3>{area.title}</h3>
              <p>{area.text}</p>
              <div className="focus-tags">{area.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const toolkit = [
  { label: 'Python', category: 'Current focus', mark: 'Py', tone: 'blue' },
  { label: 'Generative AI', category: 'Current focus', mark: 'AI', tone: 'lime' },
  { label: 'LLM applications', category: 'Exploring', mark: 'LLM', tone: 'violet' },
  { label: 'RAG & embeddings', category: 'Exploring', mark: 'R', tone: 'orange' },
  { label: 'AI agents', category: 'Exploring', mark: 'AG', tone: 'pink' },
  { label: 'Backend APIs', category: 'Building toward', mark: '{ }', tone: 'teal' },
  { label: 'FastAPI', category: 'Strengthening', mark: 'F', tone: 'mint' },
  { label: 'PostgreSQL', category: 'Strengthening', mark: 'PG', tone: 'blue' },
  { label: 'Docker', category: 'Strengthening', mark: 'D', tone: 'sky' },
]

function Toolkit() {
  return (
    <section className="section toolkit-section" id="toolkit" aria-labelledby="toolkit-title">
      <div className="container">
        <div className="toolkit-intro">
          <SectionHeading index="02" eyebrow="The tools & ideas" title="A practical toolkit,\nalways in progress." id="toolkit-title" />
          <p>A snapshot of what I work with, what I’m exploring, and where I’m building depth. The labels reflect my current focus, not a claim of mastery.</p>
        </div>
        <div className="toolkit-grid">
          {toolkit.map((item) => (
            <div className="tool-card" key={item.label}>
              <span className={`tool-mark tone-${item.tone}`} aria-hidden="true">{item.mark}</span>
              <span className="tool-name">{item.label}</span>
              <span className="tool-category">{item.category}</span>
            </div>
          ))}
        </div>
        <p className="toolkit-footnote"><span className="tiny-star">✳</span> Fundamentals first. Tools in service of the product.</p>
      </div>
    </section>
  )
}

const mindset = [
  ['Solve the real problem', 'Start from what a person needs, then choose technology that helps.'],
  ['Keep systems understandable', 'Prefer clear boundaries, readable code, and decisions that can be explained.'],
  ['Design for trust', 'Think through reliability, security, and evaluation as part of the product.'],
  ['Build, learn, refine', 'Make practical things, learn from how they behave, and improve with intention.'],
]

function Approach() {
  return (
    <section className="section approach-section" id="approach" aria-labelledby="approach-title">
      <div className="container approach-layout">
        <div className="approach-heading">
          <SectionHeading index="05" eyebrow="How I think about the work" title="Good engineering\nstarts with care." id="approach-title" />
          <p>A few principles I want to bring to every product and team.</p>
        </div>
        <div className="principles-list">
          {mindset.map(([title, text], index) => (
            <article className="principle" key={title}>
              <span className="principle-number">0{index + 1}</span>
              <div><h3>{title}</h3><p>{text}</p></div>
              <Arrow diagonal />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Direction() {
  return (
    <section className="section direction-section" id="direction" aria-labelledby="direction-title">
      <div className="container direction-panel">
        <div className="direction-main">
          <SectionHeading index="06" eyebrow="Where I’m headed" title="Build useful things.\nGrow with good people." id="direction-title" />
          <p>I’m looking for product-focused engineering opportunities with ambitious teams, including early-stage startups. I’m open to collaborating across time zones and keen to contribute, take ownership, and grow as an engineer.</p>
          <p>I’m especially interested in products where AI helps simplify a real workflow and where the engineering team cares about the details behind a dependable experience.</p>
          <a className="text-link" href="mailto:psandip2806@gmail.com">Start a conversation <Arrow /></a>
        </div>
        <div className="direction-aside" aria-label="Areas I’m excited to build in">
          <span className="aside-label">PRODUCT SPACES I’M DRAWN TO</span>
          <span className="interest-item"><span>01</span> AI assistants & knowledge tools</span>
          <span className="interest-item"><span>02</span> Intelligent automation</span>
          <span className="interest-item"><span>03</span> Developer products</span>
          <span className="interest-item"><span>04</span> AI-ready backend systems</span>
          <div className="aside-orbit" aria-hidden="true"><i /><i /><i /></div>
        </div>
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section className="contact-section" id="contact" aria-labelledby="contact-title">
      <div className="container contact-inner">
        <p className="eyebrow"><span className="eyebrow-line" /> OPEN TO WHAT’S NEXT</p>
        <h2 id="contact-title">Have a thoughtful<br />product in mind?</h2>
        <p className="contact-copy">I’d love to hear what you’re building and where a curious engineer could help.</p>
        <a className="button button-primary contact-button" href="mailto:psandip2806@gmail.com">Email Sandip <Arrow diagonal /></a>
        <div className="contact-links">
          <a href="https://github.com/sandippankhaniya03" target="_blank" rel="noreferrer">GitHub <Arrow diagonal /></a>
          <a href="mailto:psandip2806@gmail.com">psandip2806@gmail.com <Arrow diagonal /></a>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <a className="wordmark footer-wordmark" href="#top"><span className="wordmark-mark">S<span>.</span></span></a>
        <span>Learning continuously. Building practically.</span>
        <a className="back-top" href="#top">Back to top ↑</a>
        <span className="copyright">© {new Date().getFullYear()} Sandip Pankhaniya</span>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Toolkit />
    <section className="section experience-section" aria-labelledby="experience-title">
          <div className="container experience-content">
            <SectionHeading index="03" eyebrow="Experience & direction" title="Growing at the intersection." id="experience-title">
              My current experience and interests are centered on Python development and generative AI, with a focus on applying them to real product problems.
            </SectionHeading>
            <p className="experience-note">I’m developing my practice across language-model applications, backend APIs, and product engineering, with Python development and generative AI as my current foundations.</p>
          </div>
        </section>
        <Interests />
        <Approach />
        <Direction />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
