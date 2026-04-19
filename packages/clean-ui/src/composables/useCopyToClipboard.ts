import { ref } from "vue";

export function useCopyToClipboard(resetDelay = 2000) {
  const copied = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      copied.value = true;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        copied.value = false;
      }, resetDelay);
      return true;
    } catch {
      // Fallback for insecure contexts
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        copied.value = true;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          copied.value = false;
        }, resetDelay);
        return true;
      } catch {
        return false;
      }
    }
  }

  return { copied, copy };
}
