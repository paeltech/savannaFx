import { motion, Variants, Transition } from "framer-motion";
import { ReactNode } from "react";

// Common animation variants
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -100 },
  visible: { opacity: 1, x: 0 },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Common transition configs
export const defaultTransition: Transition = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1],
};

export const fastTransition: Transition = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1],
};

export const slowTransition: Transition = {
  duration: 0.8,
  ease: [0.22, 1, 0.36, 1],
};

// Reusable animated components
export const AnimatedDiv = motion.div;
export const AnimatedSection = motion.section;
export const AnimatedArticle = motion.article;

// Page transition wrapper - simplified to avoid React context issues
export const PageTransition = ({ children }: { children: ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

// Scroll-triggered animation wrapper
export const ScrollReveal = ({
  children,
  variants = fadeInUp,
  className = "",
}: {
  children: ReactNode;
  variants?: Variants;
  className?: string;
}) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={variants}
    transition={defaultTransition}
    className={className}
  >
    {children}
  </motion.div>
);

// Stagger children wrapper
export const StaggerChildren = ({
  children,
  className = "",
  staggerDelay = 0.1,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Hover scale animation wrapper
export const HoverScale = ({
  children,
  className = "",
  scale = 1.05,
}: {
  children: ReactNode;
  className?: string;
  scale?: number;
}) => (
  <motion.div
    whileHover={{ scale }}
    whileTap={{ scale: 0.98 }}
    transition={fastTransition}
    className={className}
  >
    {children}
  </motion.div>
);

// Hover lift animation wrapper
export const HoverLift = ({
  children,
  className = "",
  y = -8,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) => (
  <motion.div
    whileHover={{ y }}
    transition={fastTransition}
    className={className}
  >
    {children}
  </motion.div>
);

