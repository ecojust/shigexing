import { createRouter, createWebHistory } from "vue-router";
import Stage from "../views/Stage.vue";

const routes = [
  {
    path: "/",
    name: "Stage",
    component: Stage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
