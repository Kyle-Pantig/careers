import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface JobFiltersState {
  // Main jobs page filters
  search: string;
  workType: string;
  location: string;
  
  // Industry page specific filters (separate state)
  industrySearch: string;
  industryWorkType: string;
  industryLocation: string;
  
  // Actions for main jobs page
  setSearch: (search: string) => void;
  setWorkType: (workType: string) => void;
  setLocation: (location: string) => void;
  clearFilters: () => void;
  
  // Actions for industry page
  setIndustrySearch: (search: string) => void;
  setIndustryWorkType: (workType: string) => void;
  setIndustryLocation: (location: string) => void;
  clearIndustryFilters: () => void;
  
  // Clear all filters
  clearAllFilters: () => void;
}

export const useJobFiltersStore = create<JobFiltersState>()(
  persist(
    (set) => ({
      // Initial state - main jobs page
      search: '',
      workType: 'all',
      location: '',
      
      // Initial state - industry page
      industrySearch: '',
      industryWorkType: 'all',
      industryLocation: '',
      
      // Actions for main jobs page
      setSearch: (search) => set({ search }),
      setWorkType: (workType) => set({ workType }),
      setLocation: (location) => set({ location }),
      clearFilters: () => set({ 
        search: '', 
        workType: 'all', 
        location: '' 
      }),
      
      // Actions for industry page
      setIndustrySearch: (industrySearch) => set({ industrySearch }),
      setIndustryWorkType: (industryWorkType) => set({ industryWorkType }),
      setIndustryLocation: (industryLocation) => set({ industryLocation }),
      clearIndustryFilters: () => set({ 
        industrySearch: '', 
        industryWorkType: 'all', 
        industryLocation: '' 
      }),
      
      // Clear all filters
      clearAllFilters: () => set({
        search: '',
        workType: 'all',
        location: '',
        industrySearch: '',
        industryWorkType: 'all',
        industryLocation: '',
      }),
    }),
    {
      name: 'job-filters-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        search: state.search,
        workType: state.workType,
        location: state.location,
        industrySearch: state.industrySearch,
        industryWorkType: state.industryWorkType,
        industryLocation: state.industryLocation,
      }),
    }
  )
);

// Individual selectors - each returns a primitive, stable references
export const useMainJobFilters = () => {
  const search = useJobFiltersStore((s) => s.search);
  const workType = useJobFiltersStore((s) => s.workType);
  const location = useJobFiltersStore((s) => s.location);
  const setSearch = useJobFiltersStore((s) => s.setSearch);
  const setWorkType = useJobFiltersStore((s) => s.setWorkType);
  const setLocation = useJobFiltersStore((s) => s.setLocation);
  const clearFilters = useJobFiltersStore((s) => s.clearFilters);
  
  return {
    search,
    workType,
    location,
    setSearch,
    setWorkType,
    setLocation,
    clearFilters,
  };
};

export const useIndustryJobFilters = () => {
  const search = useJobFiltersStore((s) => s.industrySearch);
  const workType = useJobFiltersStore((s) => s.industryWorkType);
  const location = useJobFiltersStore((s) => s.industryLocation);
  const setSearch = useJobFiltersStore((s) => s.setIndustrySearch);
  const setWorkType = useJobFiltersStore((s) => s.setIndustryWorkType);
  const setLocation = useJobFiltersStore((s) => s.setIndustryLocation);
  const clearFilters = useJobFiltersStore((s) => s.clearIndustryFilters);
  
  return {
    search,
    workType,
    location,
    setSearch,
    setWorkType,
    setLocation,
    clearFilters,
  };
};
