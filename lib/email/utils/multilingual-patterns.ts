export interface LanguagePatterns {
  reject: string[];
  retail: string[];
  orderTerms: string[];
  totalTerms: string[];
  deliveryTerms: string[];
  statusTerms: Record<string, string>;
}

export const LANGUAGE_PATTERNS: Record<string, LanguagePatterns> = {
  nl: {
    reject: [
      'afmelden', 'nieuwsbrief', 'marketing', 'advertentie',
      'uitschrijven', 'no-reply', 'kennisgeving'
    ],
    retail: [
      'bol.com', 'coolblue', 'zalando', 'amazon', 'wehkamp',
      'bestelling', 'verzending', 'order', 'levering', 'pakket'
    ],
    orderTerms: ['bestelnummer', 'ordernummer', 'order number'],
    totalTerms: ['totaal', 'totaalbedrag', 'te betalen'],
    deliveryTerms: ['bezorging', 'levering', 'verzending', 'verwachte leverdatum'],
    statusTerms: {
      'besteld': 'ordered',
      'verzonden': 'shipped',
      'onderweg': 'in_transit',
      'geleverd': 'delivered',
      'afgeleverd': 'delivered'
    }
  },
  de: {
    reject: [
      'abbestellen', 'newsletter', 'werbung', 'marketing',
      'abmelden', 'keine-antwort', 'benachrichtigung'
    ],
    retail: [
      'amazon', 'zalando', 'otto', 'mediamarkt', 'saturn',
      'bestellung', 'versand', 'lieferung', 'paket', 'sendung'
    ],
    orderTerms: ['bestellnummer', 'auftragsnummer', 'ordernummer'],
    totalTerms: ['gesamtbetrag', 'summe', 'gesamt', 'zu zahlen'],
    deliveryTerms: ['lieferung', 'versand', 'zustellung', 'liefertermin'],
    statusTerms: {
      'bestellt': 'ordered',
      'versendet': 'shipped',
      'versandt': 'shipped',
      'unterwegs': 'in_transit',
      'geliefert': 'delivered',
      'zugestellt': 'delivered'
    }
  },
  fr: {
    reject: [
      'désabonner', 'se désinscrire', 'lettre d\'information', 
      'newsletter', 'marketing', 'publicité', 'notification'
    ],
    retail: [
      'amazon', 'zalando', 'fnac', 'cdiscount', 'darty',
      'commande', 'expédition', 'livraison', 'colis', 'envoi'
    ],
    orderTerms: ['numéro de commande', 'n° de commande', 'référence commande'],
    totalTerms: ['total', 'montant total', 'à payer', 'montant dû'],
    deliveryTerms: ['livraison', 'expédition', 'date de livraison', 'délai'],
    statusTerms: {
      'commandé': 'ordered',
      'commandée': 'ordered',
      'expédié': 'shipped',
      'expédiée': 'shipped',
      'en cours': 'in_transit',
      'livré': 'delivered',
      'livrée': 'delivered'
    }
  },
  en: {
    reject: [
      'unsubscribe', 'newsletter', 'marketing', 'advertisement',
      'notification', 'no-reply', 'alert'
    ],
    retail: [
      'amazon', 'order', 'shipping', 'delivery', 'package',
      'shipment', 'tracking', 'invoice'
    ],
    orderTerms: ['order number', 'order id', 'reference number'],
    totalTerms: ['total', 'amount', 'total amount', 'amount due'],
    deliveryTerms: ['delivery', 'shipping', 'estimated delivery', 'arrival'],
    statusTerms: {
      'ordered': 'ordered',
      'shipped': 'shipped',
      'in transit': 'in_transit',
      'delivered': 'delivered'
    }
  }
};

// Universal patterns that apply to all languages
export const UNIVERSAL_REJECT_PATTERNS = [
  'linkedin', 'twitter', 'facebook', 'instagram',
  'password reset', 'verify email', '2fa', 'two-factor',
  'survey', 'feedback', 'review request'
];