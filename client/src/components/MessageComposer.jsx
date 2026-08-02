import { useEffect, useRef, useState } from 'react';
import { ImageSquare, PaperPlaneRight, WarningCircle, X } from '@phosphor-icons/react';
import { api } from '../api';

export default function MessageComposer({ conversationId, onSent }) {
  const [body, setBody] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const fileInput = useRef(null);
  const textarea = useRef(null);
  const preview = image ? URL.createObjectURL(image) : null;

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [body]);

  function clearImage() {
    setImage(null);
    if (fileInput.current) fileInput.current.value = '';
  }

  async function submit(e) {
    e.preventDefault();
    if (sending || (!body.trim() && !image)) return;

    setSending(true);
    setError('');
    const data = new FormData();
    data.append('body', body);
    if (image) data.append('image', image);

    try {
      onSent(await api.post(`/conversations/${conversationId}/messages`, data));
      setBody('');
      clearImage();
      textarea.current?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  }

  return (
    <form className="composer" onSubmit={submit}>
      {error && (
        <p className="error" role="alert">
          <WarningCircle size={16} weight="fill" /> {error}
        </p>
      )}

      {image && (
        <div className="attachment">
          <img src={preview} alt="" />
          <span className="attachment-name">{image.name}</span>
          <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={clearImage} aria-label="Quitar imagen">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="composer-row">
        <button
          type="button"
          className="btn btn-secondary btn-icon"
          onClick={() => fileInput.current?.click()}
          aria-label="Adjuntar imagen"
          title="Adjuntar imagen"
        >
          <ImageSquare size={20} />
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => setImage(e.target.files[0] ?? null)}
          hidden
        />

        <textarea
          ref={textarea}
          className="textarea composer-input"
          rows={1}
          placeholder="Escribe un mensaje"
          aria-label="Mensaje"
          value={body}
          maxLength={4000}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKeyDown}
        />

        <button className="btn btn-icon" disabled={sending || (!body.trim() && !image)} aria-label="Enviar mensaje">
          <PaperPlaneRight size={20} weight="fill" />
        </button>
      </div>
    </form>
  );
}
