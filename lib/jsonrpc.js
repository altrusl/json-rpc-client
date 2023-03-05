import axios from "axios";
import Vue from "vue";
import store from "@/store";
import { processInterceptors } from "./interceptors.js";

let jsonCounter = 0;

async function jsonRpcRequest(payload, options) {
  let data;

  if (Array.isArray(payload)) {
    data = payload.map(message => {
      return buildRequestMessage(message, options);
    });
  } else {
    data = buildRequestMessage(payload, options);
  }

  return axios
    .request({
      method: "POST",
      url: "rpc/" + buildUri(payload, options),
      data
    })
    .then(response => {
      // Handle response
      // console.log(response.data);

      if (Array.isArray(response.data)) {
        response.data.forEach(msg => {
          processInterceptors(msg);
        });
        return response.data;
      } else {
        processInterceptors(response.data);

        if (response.data.result) {
          return options?.fullResponse
            ? response.data
            : response.data.result.data;
        }
      }
    })
    .catch(error => {
      console.log(error);
      console.log(error.data);
      console.log(error.response);
      if (error.response?.status === 401) {
        store.dispatch("auth/logout");
        Vue.$toast.open("Your session has expired. Please log in again.");
      }
    });
}

function buildRequestMessage(payload, options = {}) {
  const message = {
    jsonrpc: "2.0",
    method: payload.method,
    params: payload.params
    // params: payload.params ?? { origin: String },
  };
  if (options?.isNotification !== true) {
    // eslint-disable-next-line no-plusplus
    message.id = payload.id ?? jsonCounter++;
  }
  if (!message.params) {
    message.params = {};
  }
  // message.params.origin = "backOffice";
  return message;
}

function buildUri(payload, options) {
  if (options?.uri) {
    return options?.uri;
  }
  if (Array.isArray(payload)) {
    return "batch[" + payload.map(p => p.method).join("+") + "]";
  } else {
    return payload.method.replace(".", "/");
  }
}

export { jsonRpcRequest };

export default jsonRpcRequest;
