import React, { useState, useCallback, useMemo } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useActiveNavigation } from "@/hooks/useActiveNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Filter, 
  Heart, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  Stethoscope,
  Star,
  MoreHorizontal
} from "lucide-react";
import { useCustomers, usePets, useOrganizationId } from "@/hooks/useSupabaseData";
import { FamilySidebar } from "@/components/family/FamilySidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ClientsPets = () => {
  const activeMenuItem = useActiveNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const organizationId = useOrganizationId();
  const { data: customers = [], isLoading: customersLoading } = useCustomers(organizationId);
  const { data: pets = [], isLoading: petsLoading } = usePets(organizationId);

  const handleFamilyCreated = useCallback((family: any) => {
    console.log('Nova família criada:', family);
    // A query será invalidada automaticamente pelo hook
  }, []);

  // Filter customers based on search and filters
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    if (searchQuery) {
      filtered = filtered.filter(customer =>
        customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilter !== "all") {
      // Add filter logic here
    }

    return filtered;
  }, [customers, searchQuery, selectedFilter]);

  const isLoading = customersLoading || petsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar activeItem={activeMenuItem} />

        <div className="flex-1 overflow-hidden p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Famílias e Pets
              </h1>
              <p className="text-muted-foreground">
                Gerencie clientes e seus pets em um só lugar
              </p>
            </div>
            
            <FamilySidebar onFamilyCreated={handleFamilyCreated} />
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-muted rounded-full"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-muted rounded w-48"></div>
                          <div className="h-3 bg-muted rounded w-32"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma família encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? "Tente ajustar sua pesquisa" : "Cadastre a primeira família para começar"}
                  </p>
                  <FamilySidebar onFamilyCreated={handleFamilyCreated} />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {filteredCustomers.map((customer) => {
                  const customerPets = pets.filter(pet => pet.owner_id === customer.id);
                  return (
                    <Card key={customer.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {customer.name?.charAt(0) || 'C'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{customer.name}</CardTitle>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {customer.phone}
                                </div>
                                {customer.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {customer.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                              <DropdownMenuItem>Agendar consulta</DropdownMenuItem>
                              <DropdownMenuItem>Histórico</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium flex items-center gap-2">
                              <Heart className="h-4 w-4 text-pink-500" />
                              Pets da Família ({customerPets.length})
                            </h4>
                          </div>
                          
                          {customerPets.length > 0 ? (
                            <div className="grid gap-2">
                              {customerPets.map((pet) => (
                                <div 
                                  key={pet.id} 
                                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                      {pet.name?.charAt(0) || 'P'}
                                    </div>
                                    <div>
                                      <div className="font-medium">{pet.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {pet.species} • {pet.breed || 'Sem raça definida'}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Badge variant={pet.is_active ? "default" : "secondary"}>
                                      {pet.is_active ? "Ativo" : "Inativo"}
                                    </Badge>
                                    {pet.is_neutered && (
                                      <Badge variant="outline" className="text-green-600">
                                        Castrado
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Esta família ainda não tem pets cadastrados</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsPets;