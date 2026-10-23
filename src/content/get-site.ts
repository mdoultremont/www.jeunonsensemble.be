import { createServerFn } from "@tanstack/react-start";
import site from "virtual:site";

export const getSite = createServerFn({ method: "GET" }).handler(() => site);
