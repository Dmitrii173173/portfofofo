import React from "react";
import { Container } from "react-bootstrap";
import Skills from "../components/Skills";

const Home = () => {
  return (
    <Container fluid className="p-0">
      {/* Hero Section */}
      <section className="hero-section d-flex align-items-center justify-content-center min-vh-100">
        <div className="text-center">
          <h1 className="display-4 mb-4">Дмитрий</h1>
          <p className="lead mb-4">
            Исследователь в области машинного обучения и искусственного интеллекта
          </p>
        </div>
      </section>

      {/* Skills Section */}
      <Skills />

      {/* Projects Section */}
      <section className="projects-section py-5">
        <Container>
          <h2 className="text-center mb-5">Проекты</h2>
          {/* Здесь можно добавить компонент Projects */}
        </Container>
      </section>

      {/* Contact Section */}
      <section className="contact-section py-5">
        <Container>
          <h2 className="text-center mb-5">Контакты</h2>
          {/* Здесь можно добавить компонент Contact */}
        </Container>
      </section>
    </Container>
  );
};

export default Home; 