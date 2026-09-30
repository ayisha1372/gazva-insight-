import { useCallback, useRef, useState } from 'react';

/** const { confirm, dialogProps } = useConfirm(); const ok = await confirm({ message }); */
export function useConfirm() {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((opts) => {
    setState(opts);
    return new Promise((resolve) => { resolver.current = resolve; });
  }, []);

  const handle = (result) => {
    setState(null);
    resolver.current?.(result);
  };

  return { confirm, dialogProps: { state, onCancel: () => handle(false), onConfirm: () => handle(true) } };
}
