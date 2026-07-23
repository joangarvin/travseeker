import { Compass, Heart, MapPin, Users } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ScrollReveal from '../components/ui/ScrollReveal';
import logo from '../assets/logo.png';

const VALUES = [
  {
    icon: Compass,
    title: 'Revisado a mano',
    text: 'Cada destino pasa por manos humanas antes de entrar en el cuaderno. Si no se lo recomendaríamos a un amigo, fuera.',
  },
  {
    icon: Users,
    title: 'Alergia a las colas',
    text: 'Medimos la afluencia por temporada para que llegues cuando el sitio respira, no cuando revienta.',
  },
  {
    icon: MapPin,
    title: 'Números al aire',
    text: 'Municipios, precios y conexiones apuntados sin adornos. El dato es el argumento.',
  },
  {
    icon: Heart,
    title: 'Sin paquetes',
    text: 'No vendemos viajes ni cobramos por aparecer. Te damos la información y el viaje lo firmas tú.',
  },
] as const;

export default function About() {
  return (
    <div className="min-h-screen bg-[var(--color-secondary)] font-sans">
      <Header />

      <main className="pt-24 sm:pt-32 pb-16 max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center">
            <img src={logo} alt="Travseeker" className="h-14 w-auto mx-auto mb-7" />
            <h1 className="font-serif text-4xl md:text-6xl font-medium text-[var(--color-primary)] tracking-tight mb-6 leading-[1.08]">
              Nos gusta España cuando <span className="italic hand-underline">no está llena</span>.
            </h1>
            <p className="text-[var(--color-muted)] text-lg max-w-2xl mx-auto leading-relaxed">
              Travseeker nació de un cabreo concreto: llegar a un sitio precioso y no poder ni
              aparcar. Desde entonces apuntamos los lugares que aguantan bien una visita — y cuándo
              ir para no estropearlos.
            </p>
          </div>
        </ScrollReveal>
      </main>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <ScrollReveal>
          <span className="field-label text-[var(--color-teja)] mb-4 block">De dónde viene esto</span>
          <div className="space-y-6 text-[var(--color-primary)]/85 text-lg leading-relaxed">
            <p>
              Empezamos con una libreta y una hoja de cálculo: presupuesto por día, cuánta gente hay en agosto, qué municipios tienen cama y a qué precio. Aquello creció hasta convertirse en esto — fichas de destinos con sus números al aire, para que filtres por lo que de verdad te importa.
            </p>
            <p>
              No somos una agencia de viajes. Te enseñamos los datos y tú montas el viaje: a tu ritmo, con tu presupuesto y sin nadie soplándote la nuca.
            </p>
          </div>
        </ScrollReveal>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24">
        <ScrollReveal>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[var(--color-primary)] text-center mb-10 sm:mb-12 tracking-tight">
            De qué pie cojeamos
          </h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {VALUES.map(({ icon: Icon, title, text }, i) => (
            <ScrollReveal key={title} delay={(i % 3 + 1) as 1 | 2 | 3}>
              <div className="ui-card p-7 sm:p-8 h-full">
                <div className="w-10 h-10 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] flex items-center justify-center mb-5 text-[var(--color-brand)]">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-xl font-medium text-[var(--color-primary)] mb-2 tracking-tight">{title}</h3>
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
