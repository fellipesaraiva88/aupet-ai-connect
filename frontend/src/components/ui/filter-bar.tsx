import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";

interface FilterBarProps {
  filters: {
    search: string;
    status: string;
    species: string;
    dateRange: string;
    hasAnyPet: boolean | null;
    vaccination: string;
  };
  onFiltersChange: (filters: any) => void;
  activeTab: string;
}

export function FilterBar({ filters, onFiltersChange, activeTab }: FilterBarProps) {
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      status: "all",
      species: "all",
      dateRange: "all",
      hasAnyPet: null,
      vaccination: "all",
    });
  };

  const hasActiveFilters = filters.search || filters.status !== "all" || filters.species !== "all" || filters.dateRange !== "all" || filters.hasAnyPet !== null || filters.vaccination !== "all";

  return (
    <div className="bg-card rounded-lg border p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={activeTab === 'customers' ? "Buscar clientes..." : activeTab === 'pets' ? "Buscar pets..." : "Buscar clientes e pets..."}
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Status Filter */}
        <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>

        {/* Species Filter - only for pets or unified */}
        {(activeTab === 'pets' || activeTab === 'unified') && (
          <Select value={filters.species} onValueChange={(value) => updateFilter("species", value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Espécie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="dog">🐕 Cachorros</SelectItem>
              <SelectItem value="cat">🐱 Gatos</SelectItem>
              <SelectItem value="bird">🐦 Pássaros</SelectItem>
              <SelectItem value="rabbit">🐰 Coelhos</SelectItem>
              <SelectItem value="other">🐾 Outros</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Date Range */}
        <Select value={filters.dateRange} onValueChange={(value) => updateFilter("dateRange", value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mês</SelectItem>
            <SelectItem value="year">Último ano</SelectItem>
          </SelectContent>
        </Select>

        {/* Has Pets Filter - only for customers or unified */}
        {(activeTab === 'customers' || activeTab === 'unified') && (
          <Select value={filters.hasAnyPet === null ? "all" : filters.hasAnyPet ? "with_pets" : "without_pets"} onValueChange={(value) => updateFilter("hasAnyPet", value === "all" ? null : value === "with_pets")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Pets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="with_pets">Com pets</SelectItem>
              <SelectItem value="without_pets">Sem pets</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Vaccination Filter - only for pets or unified */}
        {(activeTab === 'pets' || activeTab === 'unified') && (
          <Select value={filters.vaccination} onValueChange={(value) => updateFilter("vaccination", value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Vacinação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="up_to_date">Em dia</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="overdue">Atrasada</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="text-xs">
              Busca: "{filters.search}"
              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilter("search", "")} />
            </Badge>
          )}
          {filters.status !== "all" && (
            <Badge variant="secondary" className="text-xs">
              Status: {filters.status}
              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilter("status", "all")} />
            </Badge>
          )}
          {filters.species !== "all" && (
            <Badge variant="secondary" className="text-xs">
              Espécie: {filters.species}
              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => updateFilter("species", "all")} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}