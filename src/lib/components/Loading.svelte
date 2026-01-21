<script lang="ts">
  export let show = false;
  export let onClose: (() => void) | undefined = undefined;
  
  function handleClose() {
    show = false;
    if (onClose) {
      onClose();
    }
  }
</script>

{#if show}
  <div style="
    position:fixed;inset:0;z-index:10500;display:flex;align-items:center;justify-content:center;
    background:rgba(248,250,252,0.72);backdrop-filter:blur(6px) saturate(120%);
  ">
    <div style="
      width:min(360px,90vw);padding:22px 26px;border-radius:18px;
      background:rgba(255,255,255,0.95);border:1px solid rgba(147,197,253,0.5);
      box-shadow:0 20px 50px rgba(37,99,235,0.12);display:flex;flex-direction:column;
      align-items:center;gap:12px;text-align:center;position:relative;
    ">
      <button
        on:click={handleClose}
        style="
          position:absolute;top:4px;right:4px;width:32px;height:32px;
          display:flex;align-items:center;justify-content:center;
          border:none;background:transparent;color:#64748b;font-size:28px;
          font-weight:bold;border-radius:4px;cursor:pointer;z-index:10;
        "
        aria-label="Close loading screen"
      >×</button>
      <div style="position:relative;width:96px;height:96px;">
        <span style="
          position:absolute;inset:0;border-radius:9999px;border:3px solid transparent;
          border-top-color:#2563eb;border-right-color:#93c5fd;
          animation:iso-spin 1.35s linear infinite;
          display:block;
        "></span>
        <span style="
          position:absolute;inset:12px;border-radius:9999px;border:3px solid transparent;
          border-top-color:#2563eb;border-right-color:#93c5fd;opacity:0.45;
          animation:iso-spin 1.7s linear infinite;display:block;
        "></span>
        <span style="
          position:absolute;width:18px;height:18px;border-radius:9999px;background:#2563eb;
          top:50%;left:50%;transform:translate(-50%,-50%);
          animation:iso-pulse 1.6s ease-in-out infinite;
          box-shadow:0 0 0 0 rgba(37,99,235,0.32);display:block;
        "></span>
      </div>
      <div>
        <p style="margin:0;font-weight:700;color:#0f172a;">Analyzing reachable area...</p>
        <p style="margin:2px 0 0;color:#475569;font-size:0.95rem;">Finding amenities within 15 minutes</p>
      </div>
    </div>
  </div>
{/if}

<style>
  :global {
    @keyframes iso-spin { to { transform: rotate(360deg); } }
    @keyframes iso-pulse {
      0% { box-shadow:0 0 0 0 rgba(37,99,235,0.32); }
      70% { box-shadow:0 0 0 18px rgba(37,99,235,0); }
      100% { box-shadow:0 0 0 0 rgba(37,99,235,0); }
    }
  }
  
  button:hover {
    background: rgba(0, 0, 0, 0.05) !important;
    color: #1e293b;
  }
</style>
