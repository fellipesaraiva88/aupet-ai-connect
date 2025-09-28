import React, { useState, useEffect } from "react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useCustomers, usePets, useOrganizationId } from "@/hooks/useApiData";
import { Users, Heart, Search } from "lucide-react";

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const organizationId = useOrganizationId();
  const { data: customers = [] } = useCustomers(organizationId);
  const { data: pets = [] } = usePets(organizationId);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar clientes e pets..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        {customers.length > 0 && (
          <CommandGroup heading="Clientes">
            {customers.slice(0, 5).map((customer: any) => (
              <CommandItem key={customer.id} value={customer.name}>
                <Users className="mr-2 h-4 w-4" />
                <span>{customer.name}</span>
                {customer.email && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {customer.email}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {pets.length > 0 && (
          <CommandGroup heading="Pets">
            {pets.slice(0, 5).map((pet: any) => (
              <CommandItem key={pet.id} value={pet.name}>
                <Heart className="mr-2 h-4 w-4" />
                <span>{pet.name}</span>
                {pet.species && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {pet.species}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}