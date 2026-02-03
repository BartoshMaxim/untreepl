// app/routes/app.$index.tsx
import type {
  LoaderFunctionArgs,
} from "react-router";
import { redirect} from "react-router";

const UNTREEPL_URL = "https://dev.untreepl.com/signup-brand";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return redirect(UNTREEPL_URL);
};