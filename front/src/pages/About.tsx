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
    <div className="page-shell">
      <Header />

      <main className="about-main">
        <ScrollReveal>
          <div className="about-hero">
            <img src={logo} alt="Travseeker" className="about-hero__logo" />
            <h1 className="about-hero__title">
              Nos gusta España cuando <span className="italic hand-underline">no está llena</span>.
            </h1>
            <p className="about-hero__lead">
              Travseeker nació de un cabreo concreto: llegar a un sitio precioso y no poder ni
              aparcar. Desde entonces apuntamos los lugares que aguantan bien una visita — y cuándo
              ir para no estropearlos.
            </p>
          </div>
        </ScrollReveal>
      </main>

      <section className="about-story">
        <ScrollReveal>
          <span className="about-story__eyebrow field-label">De dónde viene esto</span>
          <div className="about-story__body">
            <p>
              Empezamos con una libreta y una hoja de cálculo: presupuesto por día, cuánta gente hay en agosto, qué municipios tienen cama y a qué precio. Aquello creció hasta convertirse en esto — fichas de destinos con sus números al aire, para que filtres por lo que de verdad te importa.
            </p>
            <p>
              No somos una agencia de viajes. Te enseñamos los datos y tú montas el viaje: a tu ritmo, con tu presupuesto y sin nadie soplándote la nuca.
            </p>
          </div>
        </ScrollReveal>
      </section>

      <section className="about-values">
        <ScrollReveal>
          <h2 className="about-values__title">
            De qué pie cojeamos
          </h2>
        </ScrollReveal>
        <div className="about-values__grid">
          {VALUES.map(({ icon: Icon, title, text }, i) => (
            <ScrollReveal key={title} delay={(i % 3 + 1) as 1 | 2 | 3}>
              <div className="ui-card about-value-card">
                <div className="about-value-card__icon-wrap">
                  <Icon className="about-value-card__icon" />
                </div>
                <h3 className="about-value-card__title">{title}</h3>
                <p className="about-value-card__text">{text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
