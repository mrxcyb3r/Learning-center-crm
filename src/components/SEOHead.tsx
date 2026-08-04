import React, { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = "CenterFlow - Learning Center Management & IELTS AI Copilot",
  description = "CenterFlow empowers learning centers with automated IELTS Band 8.5+ score tracking, 24/7 AI Essay Grading, Telegram bot notifications, and revenue operations.",
  keywords = "CenterFlow, IELTS Preparation, Learning Center Management, AI Essay Feedback, CEFR English, EduTech, Student Dashboard",
  ogImage = "https://i.ibb.co/s9QWSrKZ/image.png",
  canonicalUrl = "https://centerflow.edu.uz"
}) => {
  useEffect(() => {
    // Dynamic Document Title
    document.title = title;

    // Helper to update meta tag
    const updateMetaTag = (selector: string, attribute: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        const [attrName, attrVal] = selector.replace('meta[', '').replace(']', '').split('=');
        element.setAttribute(attrName, attrVal.replace(/"/g, ''));
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, content);
    };

    // Standard Meta Tags
    updateMetaTag('meta[name="description"]', 'content', description);
    updateMetaTag('meta[name="keywords"]', 'content', keywords);

    // Open Graph Tags
    updateMetaTag('meta[property="og:title"]', 'content', title);
    updateMetaTag('meta[property="og:description"]', 'content', description);
    updateMetaTag('meta[property="og:image"]', 'content', ogImage);
    updateMetaTag('meta[property="og:url"]', 'content', canonicalUrl);
    updateMetaTag('meta[property="og:type"]', 'content', 'website');

    // Twitter Card Tags
    updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'content', title);
    updateMetaTag('meta[name="twitter:description"]', 'content', description);
    updateMetaTag('meta[name="twitter:image"]', 'content', ogImage);

    // Educational Software JSON-LD Schema
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "EducationalApplication",
      "name": "CenterFlow",
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "description": description,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "1280"
      }
    };

    let scriptElement = document.getElementById('json-ld-schema');
    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = 'json-ld-schema';
      scriptElement.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptElement);
    }
    scriptElement.textContent = JSON.stringify(schemaData);
  }, [title, description, keywords, ogImage, canonicalUrl]);

  return null;
};
