import { useEffect } from "react";

function Modal({
  isOpen,
  title,
  description,
  onClose,
  children,
  size = "md",
  headerActions = null,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass =
    size === "sm"
      ? "max-w-md"
      : size === "lg"
      ? "max-w-4xl"
      : size === "xl"
      ? "max-w-5xl"
      : "max-w-xl";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <button
        className="absolute inset-0 cursor-default"
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <section
        className={
          "relative z-10 w-full " +
          widthClass +
          " rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] transition-all overflow-hidden"
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2
              id="modal-title"
              className="text-base sm:text-lg font-black text-[#0B1E38] tracking-tight truncate"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs text-slate-400 font-medium truncate">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <button
              className="grid size-8 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              type="button"
              aria-label="Close"
              onClick={onClose}
            >
              <span className="text-xl leading-none font-bold" aria-hidden="true">
                &times;
              </span>
            </button>
          </div>
        </header>
        {children}
      </section>
    </div>
  );
}

export default Modal;
