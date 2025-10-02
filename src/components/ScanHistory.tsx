import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Scan {
  id: string;
  image_url: string;
  analysis_result: any;
  risk_level: string | null;
  recommendations: string[] | null;
  created_at: string;
}

interface ScanHistoryProps {
  userId: string;
}

const ScanHistory = ({ userId }: ScanHistoryProps) => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScans();

    const channel = supabase
      .channel("scan-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "skin_scans",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadScans();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadScans = async () => {
    try {
      const { data, error } = await supabase
        .from("skin_scans")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setScans(data || []);
    } catch (error) {
      console.error("Error loading scans:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskIcon = (riskLevel: string | null) => {
    switch (riskLevel?.toLowerCase()) {
      case "low":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "moderate":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getRiskColor = (riskLevel: string | null) => {
    switch (riskLevel?.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No scans yet. Upload your first image to get started!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {scans.map((scan) => (
        <Card key={scan.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  Scan from {format(new Date(scan.created_at), "PPP")}
                </CardTitle>
                <CardDescription>
                  {format(new Date(scan.created_at), "p")}
                </CardDescription>
              </div>
              {scan.risk_level && (
                <div className="flex items-center gap-2">
                  {getRiskIcon(scan.risk_level)}
                  <Badge className={getRiskColor(scan.risk_level)}>
                    {scan.risk_level} Risk
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <img
                src={scan.image_url}
                alt="Skin scan"
                className="rounded-lg w-full h-48 object-cover"
              />
              <div className="space-y-2">
                {scan.analysis_result ? (
                  <>
                    <div>
                      <h4 className="font-semibold mb-1">Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        {scan.analysis_result.description}
                      </p>
                    </div>
                    {scan.recommendations && scan.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-1">Recommendations</h4>
                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                          {scan.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {scan.analysis_result.disclaimer && (
                      <p className="text-xs text-muted-foreground italic">
                        {scan.analysis_result.disclaimer}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analyzing...</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ScanHistory;
