export const cleanPhoneNumber = (input: string): string => {
  // Remove all non-numeric characters
  let cleaned = input.replace(/\D/g, '');

  // Basic Brazilian validation logic
  if (cleaned.length >= 10 && cleaned.length <= 11) {
    // Determine if it lacks country code
    // Assuming mostly Brazilian usage for this app
    return `55${cleaned}`;
  }
  
  // If it already starts with 55 and has correct length
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    return cleaned;
  }

  // Fallback: return numbers only
  return cleaned;
};

export const parseInputText = (text: string): { phone: string; name?: string }[] => {
  const lines = text.split('\n');
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      // Try to split by comma, tab, or pipe if user pastes structured data
      const parts = line.split(/[,|\t]/);
      
      let rawPhone = '';
      let name = '';

      if (parts.length > 1) {
        // Assume first part is name, second is phone? Or simplistic check
        const p1 = parts[0].replace(/\D/g, '');
        const p2 = parts[1].replace(/\D/g, '');
        
        if (p1.length > 8) {
           rawPhone = parts[0];
           name = parts[1].trim();
        } else {
           name = parts[0].trim();
           rawPhone = parts[1];
        }
      } else {
        rawPhone = line;
      }

      return {
        phone: cleanPhoneNumber(rawPhone),
        name: name || undefined,
      };
    })
    .filter(item => item.phone.length >= 10);
};

export const formatPhoneDisplay = (phone: string): string => {
  if (phone.startsWith('55')) {
    const p = phone.substring(2);
    if (p.length === 11) {
      return `(${p.substring(0, 2)}) ${p.substring(2, 7)}-${p.substring(7)}`;
    }
    if (p.length === 10) {
      return `(${p.substring(0, 2)}) ${p.substring(2, 6)}-${p.substring(6)}`;
    }
  }
  return phone;
};