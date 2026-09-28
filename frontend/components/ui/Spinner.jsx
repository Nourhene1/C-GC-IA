import { LoaderCircle } from "lucide-react";

export default function Spinner({ label }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-primary">
      <LoaderCircle className="size-5 animate-spin" />
      {label}
    </div>
  );
}
