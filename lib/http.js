import axios from "axios";
import Vue from "vue";
import { router } from "@/router";
import { i18n } from "@/plugins/i18n";
import { TokenService } from "../Storage";
// import { EventBus } from "../../bus";
import jsonRpcRequest from "./jsonrpc";
import store from "@/store";

let jsonCounter = 0;

const http = {
  init(baseURL) {
    axios.defaults.baseURL = baseURL;
    http.mountNotificationInterceptor();
    // http.mountMaintenanceInterceptor();
    if (TokenService.getToken()) {
      http.setAuthHeader();
      // http.mount401Interceptor();
    }
  },

  setAuthHeader() {
    // console.log("store.state.auth.accessToken");
    if (store.state.auth.accessToken) {
      // console.log(store.state.auth.accessToken);
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${store.state.auth.accessToken}`;
    }
  },

  removeHeader() {
    console.log("removing header, ", store.state.auth.accessToken);
    delete axios.defaults.headers.common["Authorization"];
  },

  // eslint-disable-next-line no-unused-vars
  async get(url, payload = {}, options = {}) {
    try {
      const response = await axios.get(url, { params: payload });
      return response;
    } catch (error) {
      console.log(error);
    }
  },

  post(url, payload = {}, options = {}) {
    return axios.post(url, payload, options);
  },

  async jsonRpc(payload, options) {
    return jsonRpcRequest(payload, options);
  },

  // eslint-disable-next-line no-unused-vars
  async jsonRpc1(payload, options = {}) {
    try {
      if (!payload.params) {
        payload.params = {};
      }
      const { data } = await axios.request({
        method: "POST",
        url: "rpc/" + payload.method.replace(".", "/"),
        // eslint-disable-next-line no-plusplus
        data: {
          jsonrpc: "2.0",
          method: payload.method,
          params: payload.params,
          // eslint-disable-next-line no-plusplus
          id: jsonCounter++
        }
      });
      // console.log(data);
      if (data.result) {
        return data.result.data;
      }
    } catch (error) {
      console.log("error");
      console.log(error);
    }
  },

  // _401interceptor: null,
  _notificationInterceptor: null,
  _maintenanceInterceptor: null,

  // mount401Interceptor() {
  //   if (this._401interceptor !== null) return;

  //   this._401interceptor = axios.interceptors.response.use(
  //     response => {
  //       return response;
  //     },
  //     error => {
  //       console.log(error);
  //       throw error;
  //     }
  //   );
  // },

  // unmount401Interceptor() {
  //   axios.interceptors.response.eject(this._401interceptor);
  // },

  mountNotificationInterceptor() {
    if (this._notificationInterceptor !== null) return;

    this._notificationInterceptor = axios.interceptors.response.use(
      response => {
        // console.log(response.data);
        // console.log(store);
        if (response.data.error?.code === 401) {
          store.dispatch("auth/logout");
        }
        let message =
          response.data.error?.data?.i18n ? "errors." + response.data.error?.data?.i18n : response.data.error?.message;
        if (message) {
          Vue.$toast.open({
            message: i18n.t(message),
            type: "error"
          });
        }
        message = response.data.result?.message || response.data.message;
        if (message) {
          Vue.$toast.open(i18n.t("messages." + message));
        }

        // console.f(response.data);
        // (response.data.notifications ?? []).forEach(message => {
        //   // Vue.$toast.open({message});
        //   Vue.$toast.open({
        //     message
        //   });
        // });
        if (response.data.toast) {
          Vue.$toast.open(response.data.toast);
        }
        return response;
      },
      error => {
        // if (response.data.notifications) {
        //   response.data.notifications.forEach(message => {
        //     Vue.$toast.open({message});
        //   });
        // }
        throw error;
      }
    );
  },
  mountMaintenanceInterceptor() {
    if (!this._maintenanceInterceptor) {
      this._maintenanceInterceptor = axios.interceptors.response.use(
        response => {
          try {
            let meta = response.data.jsonrpc
              ? response.data.result.meta
              : response.data.meta;
            if (meta.websiteMode == 0) {
              router.push({ name: "maintenance" });
            } else if (router.currentRoute.name == "maintenance") {
              router.push({ name: "/" });
            }
            if (meta.geoBlocked == 1) {
              router.push({ name: "geo-blocked" });
            } else if (router.currentRoute.name == "geo-blocked") {
              router.push({ name: "/" });
            }
          } catch (error) {
            console.log("Error in maintenance:", response);
            console.log(error);
          }
          return response;
        }
        // error => {
        //   throw error;
        // }
      );
    }
  }
};

export default http;
