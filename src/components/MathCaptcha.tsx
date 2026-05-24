import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";

interface Props {
  onValidChange: (valid: boolean) => void;
}

const gen = () => {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const ops = ["+", "-", "×"] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  const result = op === "+" ? a + b : op === "-" ? a - b : a * b;
  return { a, b, op, result };
};

const MathCaptcha = ({ onValidChange }: Props) => {
  const [challenge, setChallenge] = useState(gen());
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    onValidChange(answer.trim() !== "" && Number(answer) === challenge.result);
  }, [answer, challenge, onValidChange]);

  const refresh = () => { setChallenge(gen()); setAnswer(""); };

  return (
    <div>
      <Label className="text-xs">Vérification anti-robot</Label>
      <div className="mt-1 flex items-center gap-2">
        <div className="flex-1 rounded-md bg-input border border-border px-3 py-2 text-sm font-display font-bold tracking-wider select-none">
          {challenge.a} {challenge.op} {challenge.b} = ?
        </div>
        <Input
          type="number"
          inputMode="numeric"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Réponse"
          className="w-24 bg-input border-border text-sm"
          required
        />
        <button type="button" onClick={refresh} className="p-2 rounded-md bg-muted hover:bg-accent text-muted-foreground" title="Nouveau calcul">
          <RefreshCw size={14} />
        </button>
      </div>
    </div>
  );
};

export default MathCaptcha;