import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Sparkles, Zap } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";

interface BuyCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const creditPackages = [
  {
    name: "Starter Pack",
    credits: 50,
    price: "$9.99",
    icon: Coins,
    popular: false,
  },
  {
    name: "Popular Pack",
    credits: 150,
    price: "$24.99",
    icon: Sparkles,
    popular: true,
  },
  {
    name: "Pro Pack",
    credits: 500,
    price: "$79.99",
    icon: Zap,
    popular: false,
  },
];

export const BuyCreditsModal = ({ open, onOpenChange }: BuyCreditsModalProps) => {
  const { addCredits } = useCredits();

  const handlePurchase = (credits: number) => {
    // Mock purchase - in real app this would integrate with payment processor
    addCredits(credits);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Purchase Credits</DialogTitle>
          <DialogDescription>
            Choose a credit package to continue using AI features
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          {creditPackages.map((pkg) => {
            const Icon = pkg.icon;
            return (
              <div
                key={pkg.name}
                className={`relative rounded-lg border p-6 flex flex-col items-center gap-4 transition-all hover:shadow-lg ${
                  pkg.popular
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    POPULAR
                  </div>
                )}
                
                <div className={`rounded-full p-3 ${pkg.popular ? "bg-primary/10" : "bg-secondary"}`}>
                  <Icon className={`w-6 h-6 ${pkg.popular ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{pkg.name}</h3>
                  <p className="text-3xl font-bold text-foreground mt-2">{pkg.credits}</p>
                  <p className="text-sm text-muted-foreground">credits</p>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{pkg.price}</p>
                </div>
                
                <Button
                  onClick={() => handlePurchase(pkg.credits)}
                  variant={pkg.popular ? "default" : "outline"}
                  className="w-full"
                >
                  Purchase
                </Button>
              </div>
            );
          })}
        </div>
        
        <div className="text-center text-sm text-muted-foreground mt-2">
          Credits are used for AI-powered features like event generation, descriptions, and image creation
        </div>
      </DialogContent>
    </Dialog>
  );
};
