"use client";

import Header from "@bill/_components/landing/Header";
import HeroSection from "@bill/_components/landing/HeroSection";
import FeaturesSection from "@bill/_components/landing/FeaturesSection";
import PricingSection from "@bill/_components/landing/PricingSection";
import FAQSection from "@bill/_components/landing/FAQSection";
import CTASection from "@bill/_components/landing/CTASection";
import Footer from "@bill/_components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
