import { onRequestPost as __api_contact_js_onRequestPost } from "C:\\Users\\Jana Store\\OneDrive\\Desktop\\My Work\\MOS Logix\\Website\\functions\\api\\contact.js"
import { onRequest as __api_generate_js_onRequest } from "C:\\Users\\Jana Store\\OneDrive\\Desktop\\My Work\\MOS Logix\\Website\\functions\\api\\generate.js"

export const routes = [
    {
      routePath: "/api/contact",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_contact_js_onRequestPost],
    },
  {
      routePath: "/api/generate",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_generate_js_onRequest],
    },
  ]