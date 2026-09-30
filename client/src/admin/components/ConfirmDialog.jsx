import Modal from './Modal.jsx';

/** Simple confirm({ title, message, confirmLabel, danger }) → boolean, via a rendered <ConfirmHost/>. */
export default function ConfirmDialog({ state, onCancel, onConfirm }) {
  if (!state) return null;
  return (
    <Modal
      title={state.title || 'Are you sure?'}
      onClose={onCancel}
      footer={
        <>
          <button className="abtn abtn-outline" onClick={onCancel}>Cancel</button>
          <button className={`abtn ${state.danger ? 'abtn-danger' : 'abtn-primary'}`} onClick={onConfirm} autoFocus>
            {state.confirmLabel || 'Confirm'}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--ink-soft)', fontSize: '0.92rem' }}>{state.message}</p>
    </Modal>
  );
}
