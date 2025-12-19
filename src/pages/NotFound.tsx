import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { PageTransition, fadeInUp, scaleIn } from "@/lib/animations";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-[#14241f]">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={scaleIn}
          className="text-center"
        >
          <motion.h1
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-6xl md:text-8xl font-bold mb-4 text-white"
          >
            404
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-[#f4c464]/80 mb-4"
          >
            Oops! Page not found
          </motion.p>
          <motion.a
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="/"
            className="text-[#f4c464] hover:text-[#f4c464]/80 underline text-lg"
          >
            Return to Home
          </motion.a>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default NotFound;
