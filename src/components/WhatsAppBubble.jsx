export default function WhatsAppBubble() {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER || '254700000000';
  const text = encodeURIComponent('Hello Richard Kwanya Snr Ministry, I would like to know more.');
  return (
    <a className="wa" href={`https://wa.me/${number}?text=${text}`} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
      <span className="wa-tip">Chat with us on WhatsApp</span>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6A12 12 0 0 0 12 24c6.6 0 12-5.4 12-12 0-3.2-1.2-6.200-3.500-8.500ZM12 21.900c-1.800 0-3.600-.5-5.100-1.400l-.4-.2-3.700 1 1-3.600-.2-.4A9.900 9.900 0 0 1 2.100 12C2.100 6.500 6.500 2.100 12 2.100c2.600 0 5.100 1 7 2.900a9.800 9.800 0 0 1 2.900 7c0 5.500-4.400 9.900-9.900 9.900Zm5.400-7.400c-.3-.1-1.800-.9-2-1s-.5-.1-.7.1-.8 1-.9 1.100-.3.200-.6.100a8 8 0 0 1-4-3.500c-.3-.5.300-.5.900-1.600.1-.2 0-.4 0-.5l-.9-2.200c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.100-.8.400s-1 1-1 2.400 1 2.800 1.200 3c.1.200 2 3.100 4.900 4.300 1.800.8 2.500.9 3.400.7.600-.1 1.800-.7 2-1.400.2-.7.200-1.300.2-1.400-.1-.1-.3-.2-.6-.3Z" />
      </svg>
    </a>
  );
}
