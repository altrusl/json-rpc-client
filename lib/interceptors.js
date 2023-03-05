import { router } from "@/router";
import { useConfig } from "@/composables/useConfig";

const config = useConfig();

function processInterceptors(message) {
  handleError(message);
  try {
    let meta = message.result.meta;
    if (meta.websiteMode == 0) {
      router.push({ name: "maintenance" });
    } else if (router.currentRoute.name == "maintenance") {
      router.push({ name: "/" });
    }
    config.geoblocked.value = meta.geoBlocked == 1;
    if (router.currentRoute.name == "geo-blocked" && !config.geoblocked.value) {
      router.push({ name: "/" });
    }
  } catch (error) {
    console.log("Error in maintenance:", message);
    console.log(error);
  }
}

function handleError(message) {
  if (message.error) {
    console.log("JSON-RPC error: ", message.error.message, message.error.data);
  }
}


export { processInterceptors };

// export default processInterceptors;
