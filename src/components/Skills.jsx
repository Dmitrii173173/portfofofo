import React from "react";
import { useSelector } from "react-redux";
import { selectMode } from "../app/appSlice";
import { Element } from "react-scroll";
import { Container, Row, Col } from "react-bootstrap";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Title from "./Title";
import { skillData } from "../config";

const Skills = () => {
  const theme = useSelector(selectMode);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <Element name="Skills" id="skills">
      <section className="section py-5">
        <Container>
          <Title size="h2" text="Skills" />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Row className="mt-4 g-4">
              {skillData.map((skill) => (
                <Col key={skill.id} xs={6} sm={4} md={3} lg={2}>
                  <motion.div
                    variants={itemVariants}
                    className="skill-card p-3 text-center"
                    style={{
                      background: theme === "light" ? "#f8f9fa" : "#343a40",
                      borderRadius: "10px",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      transition: "all 0.3s ease"
                    }}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)"
                    }}
                  >
                    <div className="skill-icon mb-2">
                      {skill.skill}
                    </div>
                    <h6 className="skill-name mb-0" style={{
                      color: theme === "light" ? "#212529" : "#f8f9fa"
                    }}>
                      {skill.name}
                    </h6>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </motion.div>
        </Container>
      </section>
    </Element>
  );
};

export default Skills; 