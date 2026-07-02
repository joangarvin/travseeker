import { Compass, Heart, MapPin, Users } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ScrollReveal from '../components/ui/ScrollReveal';
import logo from '../assets/logo.png';

const VALUES = [
  {
    icon: Compass,
    title: 'Curación experta',
    text: 'Cada destino pasa por un proceso de selección basado en autenticidad, accesibilidad y experiencia real del viajero.',
  },
  {
    icon: Users,
    title: 'Contra la masificación',
    text: 'Medimos la afluencia turística por época del año para que elijas cuándo visitar cada lugar con tranquilidad.',
  },
  {
    icon: MapPin,
    title: 'España al detalle',
    text: 'Desde costas escondidas hasta pueblos de interior: mapeamos municipios, precios y conexiones para que planifiques sin sorpresas.',
  },
  {
    icon: Heart,
    title: 'Viaje con intención',
    text: 'No vendemos paquetes. Te damos la información para que construyas tu propia aventura, a tu ritmo y con tu presupuesto.',
  },
] as const;

export default function About() {
  return (
    <div className="min-h-screen bg-[var(--color-secondary)] font-sans">
      <Header />

      <main className="pt-24 sm:pt-32 pb-20 max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <img src={logo} alt="Travseeker" className="h-16 w-auto mx-auto mb-8" />
            <h1 className="font-serif text-4xl md:text-6xl font-medium text-[var(--color-primary)] tracking-tight mb-6">
              Viajar bien es <span className="text-gradient-brand italic">viajar informado</span>
            </h1>
            <p className="text-[var(--color-muted)] text-lg max-w-2xl mx-auto font-light leading-relaxed">
              Travseeker nació de una idea simple: que encontrar tu próximo destino en España no debería depender del algoritmo ni del turismo de masas.
            </p>
          </ScrollReveal>
        </div>
      </main>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <ScrollReveal>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)] mb-4">Nuestra historia</h2>
          <div className="space-y-6 text-[var(--color-primary)]/80 text-lg font-light leading-relaxed">
            <p>
              Empezamos recopilando datos de decenas de destinos españoles — presupuesto, tipo de turismo, nivel de masificación por temporada, municipios recomendados — y los organizamos para que cualquier viajero pueda filtrarlos según lo que realmente le importa.
            </p>
            <p>
              No somos una agencia de viajes. Somos una herramienta de descubrimiento: te mostramos opciones que encajan contigo y te damos la información para que tomes la mejor decisión.
            </p>
          </div>
        </ScrollReveal>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <ScrollReveal>
          <h2 className="text-3xl font-semibold text-[var(--color-primary)] text-center mb-14 tracking-tight">
            Lo que nos define
          </h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VALUES.map(({ icon: Icon, title, text }, i) => (
            <ScrollReveal key={title} delay={(i % 3 + 1) as 1 | 2 | 3}>
              <div className="p-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-brand)]/20 transition-colors h-full">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-brand)]/10 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-[var(--color-brand)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-2">{title}</h3>
                <p className="text-[var(--color-muted)] text-sm leading-relaxed">{text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
