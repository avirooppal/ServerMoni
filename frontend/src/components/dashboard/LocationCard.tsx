import { useQuery } from "@tanstack/react-query";
import { MapPin, Loader2 } from "lucide-react";

interface GeoIPData {
  ip: string;
  city: string;
  region: string;
  country: string;
  timezone: string;
  org: string;
  postal?: string;
}

const LocationCard = () => {
  const { data, isLoading, isError } = useQuery<GeoIPData>({
    queryKey: ["geoip"],
    queryFn: async () => {
      const res = await fetch("https://ipinfo.io/json?token=");
      if (!res.ok) throw new Error("geo-IP unavailable");
      return res.json();
    },
    staleTime: 1000 * 60 * 10, // cache for 10 minutes — IP location rarely changes
    retry: 1,
  });

  const rows = [
    { label: "City", value: data?.city ?? "—" },
    { label: "Country", value: data?.country ?? "—" },
    { label: "Region", value: data?.region ?? "—" },
    { label: "Timezone", value: data?.timezone ?? "—" },
    { label: "IP", value: data?.ip ?? "—" },
    { label: "ISP / Org", value: data?.org ?? "—" },
  ];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Location</h3>
        {isLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-auto" />}
        {isError && <span className="text-xs text-destructive ml-auto">Unavailable</span>}
      </div>
      <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
        {rows.map((r) => (
          <div key={r.label} className={r.label === "ISP / Org" ? "col-span-2" : ""}>
            <p className="text-muted-foreground text-xs">{r.label}</p>
            <p className="text-foreground font-medium truncate">{r.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationCard;
