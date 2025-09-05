"use client";

import {
  ExposableVisitor,
  markCollectionCompleted,
} from "@/actions/visitor.action";
import { getCollectionsData } from "@/actions/collection.action";
import { useEffect, useState, useMemo } from "react";

interface Collection {
  id: string;
  name: string;
  slug: string;
  itemSlugs: string[];
}

interface VisitorCacheData {
  fingerprint: string;
  visitor?: ExposableVisitor;
  timestamp: number;
  visitedItems: string[];
  completedCollections: string[];
}

const CACHE_KEY = "jardim_botanico_visitor";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const CACHE_UPDATE_EVENT = "jardim_botanico_cache_update";

// Dispatch cache update event
function dispatchCacheUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CACHE_UPDATE_EVENT));
  }
}

// Generate a simple browser fingerprint
function generateBrowserFingerprint(): string {
  if (typeof window === "undefined") return "server";

  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("Jardim Botânico UFSM", 2, 2);
    }

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join("|");

    // Simple hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(36);
  } catch (error) {
    console.warn("Erro ao gerar fingerprint:", error);
    return "fallback-" + Date.now();
  }
}

// Helper function to check if a collection is completed
function isCollectionCompleted(
  collectionItems: string[],
  visitedItems: string[]
): boolean {
  return collectionItems.every((item) => visitedItems.includes(item));
}

export function useVisitorCache() {
  const [hasRegistered, setHasRegistered] = useState(false);
  const [lastRegisteredVisitor, setLastRegisteredVisitor] = useState<
    ExposableVisitor | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [visitedItems, setVisitedItems] = useState<string[]>([]);
  const [completedCollections, setCompletedCollections] = useState<
    Collection[]
  >([]);
  const [forceUpdateTrigger, setForceUpdateTrigger] = useState(0);

  // Listen for cache updates
  useEffect(() => {
    const handleCacheUpdate = () => {
      setForceUpdateTrigger((prev) => prev + 1);
    };

    if (typeof window !== "undefined") {
      window.addEventListener(CACHE_UPDATE_EVENT, handleCacheUpdate);
      return () => {
        window.removeEventListener(CACHE_UPDATE_EVENT, handleCacheUpdate);
      };
    }
  }, []);

  // Sync state with cache when update event is triggered
  useEffect(() => {
    const syncWithCache = async () => {
      if (typeof window === "undefined") return;

      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return;

        const data: VisitorCacheData = JSON.parse(cached);

        // Update local state to match cache
        setVisitedItems(data.visitedItems || []);
        setHasRegistered(!!data.visitor);
        setLastRegisteredVisitor(data.visitor);

        // Update completed collections
        if (data.visitedItems && data.visitedItems.length > 0) {
          const collectionsData = await getCollectionsData();
          if (collectionsData.success && collectionsData.data) {
            const completed = collectionsData.data.filter((collection) =>
              isCollectionCompleted(
                collection.itemSlugs,
                data.visitedItems || []
              )
            );
            setCompletedCollections(completed);
          }
        }
      } catch (error) {
        console.error("Erro ao sincronizar com cache:", error);
      }
    };

    if (forceUpdateTrigger > 0) {
      syncWithCache();
    }
  }, [forceUpdateTrigger]);

  // Only run effects on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      checkCache();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkCache = () => {
    try {
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        // Initialize with empty data
        const initialData: VisitorCacheData = {
          fingerprint: generateBrowserFingerprint(),
          timestamp: Date.now(),
          visitedItems: [],
          completedCollections: [],
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(initialData));
        setVisitedItems([]);
        setCompletedCollections([]);
        setIsLoading(false);
        return;
      }

      const data: VisitorCacheData = JSON.parse(cached);
      const now = Date.now();

      // Check if cache expired
      if (now - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        setIsLoading(false);
        return;
      }

      // Check if fingerprint matches (same device)
      const currentFingerprint = generateBrowserFingerprint();

      if (data.fingerprint === currentFingerprint) {
        setHasRegistered(!!data.visitor);
        setLastRegisteredVisitor(data.visitor);
        setVisitedItems(data.visitedItems || []);

        // Initialize completed collections without updating cache to avoid loops
        initializeCompletedCollections(data.visitedItems || []);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao verificar cache:", error);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(CACHE_KEY);
        } catch (clearError) {
          console.error("Erro ao limpar cache corrompido:", clearError);
        }
      }
      setIsLoading(false);
    }
  };

  // Initialize completed collections during cache check without updating cache
  const initializeCompletedCollections = async (
    currentVisitedItems: string[]
  ) => {
    try {
      const collectionsData = await getCollectionsData();
      if (!collectionsData.success || !collectionsData.data) {
        return;
      }

      const completed = collectionsData.data.filter((collection) =>
        isCollectionCompleted(collection.itemSlugs, currentVisitedItems)
      );

      setCompletedCollections(completed);
    } catch (error) {
      console.error("Erro ao inicializar coleções completadas:", error);
    }
  };

  const updateCacheData = (updates: Partial<VisitorCacheData>) => {
    try {
      if (typeof window === "undefined") return;

      const cached = localStorage.getItem(CACHE_KEY);
      let currentData: VisitorCacheData;

      if (cached) {
        currentData = JSON.parse(cached);
      } else {
        currentData = {
          fingerprint: generateBrowserFingerprint(),
          timestamp: Date.now(),
          visitedItems: [],
          completedCollections: [],
        };
      }

      // Merge correto - preservar arrays existentes e adicionar novos dados
      const updatedData: VisitorCacheData = {
        ...currentData,
        ...updates,
        timestamp: Date.now(),
        // Se há visitedItems nos updates, usar eles, senão manter os existentes
        visitedItems: updates.visitedItems || currentData.visitedItems || [],
        // Se há completedCollections nos updates, usar eles, senão manter os existentes
        completedCollections:
          updates.completedCollections ||
          currentData.completedCollections ||
          [],
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedData));

      // Notify components that cache was updated
      dispatchCacheUpdate();
    } catch (error) {
      console.error("Erro ao atualizar cache:", error);
    }
  };

  const updateCompletedCollections = async (
    currentVisitedItems: string[],
    updateCache: boolean = true
  ) => {
    try {
      const collectionsData = await getCollectionsData();
      if (!collectionsData.success || !collectionsData.data) {
        console.error(
          "Erro ao buscar dados das coleções:",
          collectionsData.error
        );
        return;
      }

      const newlyCompleted = collectionsData.data.filter((collection) =>
        isCollectionCompleted(collection.itemSlugs, currentVisitedItems)
      );

      // Check which collections are new (not previously completed)
      const previouslyCompletedSlugs = completedCollections.map((c) => c.slug);
      const newCompletions = newlyCompleted.filter(
        (collection) => !previouslyCompletedSlugs.includes(collection.slug)
      );

      setCompletedCollections(newlyCompleted);

      // Only update cache if requested (to avoid infinite loops)
      if (updateCache) {
        updateCacheData({
          completedCollections: newlyCompleted.map((c) => c.slug),
        });
      }

      // Check for registered visitor in both state and cache
      let registeredVisitor = lastRegisteredVisitor;

      if (!registeredVisitor && typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const cacheData = JSON.parse(cached);
            registeredVisitor = cacheData.visitor;
          }
        } catch (error) {
          console.error("Erro ao verificar visitante no cache:", error);
        }
      }

      // If there are new collections completed and visitor is registered, save to database
      if (newCompletions.length > 0 && registeredVisitor) {
        // console.log(
        //   `🏆 Salvando ${newCompletions.length} nova(s) coleção(ões) completada(s) para o visitante ${registeredVisitor.name}`
        // );

        for (const collection of newCompletions) {
          try {
            // console.log(`📚 Salvando coleção completada: ${collection.name}`);

            const result = await markCollectionCompleted(
              registeredVisitor.id,
              collection.id
            );

            if (result.success) {
              // console.log(
              //   `✅ Coleção ${collection.name} salva com sucesso no banco de dados`
              // );
            } else {
              // If already exists, not a critical error
              if (!result.error?.includes("já marcada como concluída")) {
                console.error(
                  `Erro ao marcar coleção ${collection.name} como completada:`,
                  result.error
                );
              } else {
                // console.log(
                //   `ℹ️ Coleção ${collection.name} já estava marcada como completada no banco`
                // );
              }
            }
          } catch (error) {
            console.error(
              `Erro ao salvar coleção completada ${collection.name}:`,
              error
            );
          }
        }
      } else if (newCompletions.length > 0 && !registeredVisitor) {
        // console.log(
        //   `⚠️ ${newCompletions.length} nova(s) coleção(ões) completada(s), mas visitante não está registrado ainda`
        // );
      }
    } catch (error) {
      console.error("Erro ao verificar coleções completadas:", error);
    }
  };

  const markItemAsVisited = async (itemSlug: string) => {
    try {
      // Use cache as source of truth
      const cached = localStorage.getItem(CACHE_KEY);
      let currentVisitedItems: string[] = [];

      if (cached) {
        const cacheData = JSON.parse(cached);
        currentVisitedItems = cacheData.visitedItems || [];
      }

      // Check if item was already visited (using cache data)
      if (currentVisitedItems.includes(itemSlug)) {
        return; // Item already visited
      }

      // Create new array based on cache data (not local state)
      const newVisitedItems = [...currentVisitedItems, itemSlug];

      // Update local state
      setVisitedItems(newVisitedItems);

      // Update cache
      updateCacheData({ visitedItems: newVisitedItems });

      // Check if any collection was completed
      await updateCompletedCollections(newVisitedItems);
    } catch (error) {
      console.error("Erro ao marcar item como visitado:", error);
    }
  };

  const markAsRegistered = async (visitor: ExposableVisitor) => {
    try {
      if (typeof window === "undefined") return;

      updateCacheData({ visitor });
      setHasRegistered(true);
      setLastRegisteredVisitor(visitor);

      // If there are already completed collections, save to database
      if (completedCollections.length > 0) {
        for (const collection of completedCollections) {
          try {
            const result = await markCollectionCompleted(
              visitor.id,
              collection.id
            );
            if (!result.success) {
              // If already exists, not a critical error
              if (!result.error?.includes("já marcada como concluída")) {
                console.error(
                  `Erro ao marcar coleção ${collection.name} como completada:`,
                  result.error
                );
              }
            }
          } catch (error) {
            console.error(
              `Erro ao salvar coleção completada ${collection.name}:`,
              error
            );
          }
        }
      }
    } catch (error) {
      console.error("Erro ao salvar registro de visitante:", error);
    }
  };

  const clearCache = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(CACHE_KEY);
      }
      setHasRegistered(false);
      setLastRegisteredVisitor(undefined);
      setVisitedItems([]);
      setCompletedCollections([]);
    } catch (error) {
      console.error("Erro ao limpar cache:", error);
    }
  };

  const getProgressSummary = useMemo(() => {
    return {
      totalItemsVisited: visitedItems.length,
      totalCollectionsCompleted: completedCollections.length,
      completedCollectionNames: completedCollections.map((c) => c.name),
      hasRegistered,
      lastRegisteredVisitor,
    };
  }, [
    visitedItems,
    completedCollections,
    hasRegistered,
    lastRegisteredVisitor,
  ]);

  const hasVisitedAnyItem = useMemo(() => {
    return visitedItems.length > 0;
  }, [visitedItems]);

  return {
    // Visitor registration
    hasRegistered,
    lastRegisteredName: lastRegisteredVisitor,
    lastRegisteredVisitor,
    isLoading,
    markAsRegistered,

    // Progress tracking
    visitedItems,
    completedCollections,
    markItemAsVisited,

    // Utilities
    clearCache,
    checkCache,
    getProgressSummary,
    hasVisitedAnyItem,
  };
}
