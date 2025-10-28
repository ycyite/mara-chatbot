class EscalationService {
  constructor() {
    this.contacts = this.initializeContacts();
  }

  /**
   * Initialize contact database
   */
  initializeContacts() {
    return {
      fees: {
        department: 'MSU Student Council - Fee Inquiries',
        contact_person: 'Rashid Farooq',
        email: 'rashiq.farooq@mcmaster.ca',
        phone: null,
        office_hours: 'Mon-Thurs 8:00am-12:00pm, Fri 10:00am-12:00pm',
        response_time: '2-4 business days',
        services: ['Fee exemptions', 'Bus pass inquiries', 'Gym fee questions']
      },
      wellness: {
        department: 'Student Wellness Centre',
        contact_person: 'Counseling Team',
        email: 'wellness@mcmaster.ca',
        phone: '905-525-9140 ext. 27700',
        office_hours: '8:00am-10:00pm daily',
        response_time: '45 minutes for callback',
        services: ['Mental health support', 'Counseling', 'Crisis intervention', 'Stress management']
      },
      mental_health: {
        department: 'Student Wellness Centre - Crisis Support',
        contact_person: 'Crisis Counselor',
        email: 'wellness@mcmaster.ca',
        phone: '905-525-9140 ext. 27700',
        emergency_line: '1-866-925-5454',
        office_hours: '24/7 crisis line available',
        response_time: 'Immediate',
        services: ['Crisis intervention', 'Emergency mental health support']
      },
      academics: {
        department: 'Academic Advising',
        contact_person: 'Academic Advisor',
        email: 'advising@mcmaster.ca',
        phone: '905-525-9140 ext. 24800',
        office_hours: 'Mon-Fri 9:00am-4:00pm',
        response_time: '1-2 business days',
        services: ['Course selection', 'Academic planning', 'Program requirements']
      },
      admissions: {
        department: 'Software Engineering - Admissions',
        contact_person: 'Dr. Laura Bennett',
        email: 'bennettl@mcmaster.ca',
        phone: '905-525-9140 ext. 24500',
        office_hours: 'Mon-Thurs 9:00am-3:00pm',
        response_time: '1-2 business days',
        services: ['Degree completion program', 'Application questions', 'Program information']
      },
      technical: {
        department: 'IT Services',
        contact_person: 'Tech Support',
        email: 'uts@mcmaster.ca',
        phone: '905-525-9140 ext. 24357',
        office_hours: 'Mon-Fri 8:00am-5:00pm',
        response_time: '24 hours',
        services: ['Mosaic access', 'Email issues', 'Online platform support']
      },
      general: {
        department: 'Student Services',
        contact_person: 'Student Support',
        email: 'student.services@mcmaster.ca',
        phone: '905-525-9140',
        office_hours: 'Mon-Fri 8:30am-4:30pm',
        response_time: '1-2 business days',
        services: ['General inquiries', 'Student support']
      }
    };
  }

  /**
   * Get contact information by category
   */
  getContact(category, userType = 'current') {
    const contact = this.contacts[category] || this.contacts.general;

    // Format for prospective students
    if (userType === 'prospective' && category !== 'admissions') {
      return this.contacts.admissions;
    }

    return contact;
  }

  /**
   * Format contact information for display
   */
  formatContactInfo(contact, includeInstructions = true) {
    let message = `\n📞 **${contact.department}**\n\n`;

    if (contact.contact_person) {
      message += `**Contact:** ${contact.contact_person}\n`;
    }

    if (contact.email) {
      message += `**Email:** ${contact.email}\n`;
    }

    if (contact.phone) {
      message += `**Phone:** ${contact.phone}\n`;
    }

    if (contact.emergency_line) {
      message += `**24/7 Crisis Line:** ${contact.emergency_line}\n`;
    }

    if (contact.office_hours) {
      message += `**Office Hours:** ${contact.office_hours}\n`;
    }

    if (contact.response_time) {
      message += `**Expected Response Time:** ${contact.response_time}\n`;
    }

    if (includeInstructions) {
      message += `\nI'll connect you with them to help resolve your concern.`;
    }

    return message;
  }

  /**
   * Get callback instructions
   */
  getCallbackInstructions(contact, phoneNumber) {
    const maskedPhone = this.maskPhoneNumber(phoneNumber);

    return `Great! The number ending in ${maskedPhone} will receive a call within ${contact.response_time} from the ${contact.department}.

If that number has changed, please update it on registrar.mcmaster.ca.`;
  }

  /**
   * Check if department is currently available
   */
  isAvailable(category) {
    const contact = this.contacts[category];
    if (!contact || !contact.office_hours) {
      return { available: false, reason: 'Unknown hours' };
    }

    // Simple availability check (would be more sophisticated in production)
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    // 24/7 services
    if (contact.office_hours.includes('24/7')) {
      return { available: true };
    }

    // Weekend check
    if (day === 0 || day === 6) {
      return { available: false, reason: 'Closed on weekends' };
    }

    // Basic hours check (8am-5pm)
    if (hour >= 8 && hour < 17) {
      return { available: true };
    }

    return { available: false, reason: 'Outside office hours' };
  }

  /**
   * Get escalation priority level
   */
  getEscalationPriority(emotionalState, category) {
    if (emotionalState === 'crisis' || category === 'mental_health') {
      return 'URGENT';
    }

    if (emotionalState === 'stressed' && category === 'wellness') {
      return 'HIGH';
    }

    return 'NORMAL';
  }

  /**
   * Mask phone number for privacy
   */
  maskPhoneNumber(phoneNumber) {
    if (!phoneNumber) return 'XXXX';
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.slice(-4);
  }

  /**
   * Get all contacts for a user type
   */
  getAllContacts(userType = 'current') {
    if (userType === 'prospective') {
      return {
        admissions: this.contacts.admissions,
        general: this.contacts.general
      };
    }
    return this.contacts;
  }
}

module.exports = new EscalationService();
