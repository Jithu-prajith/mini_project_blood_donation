import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface ClinicalDisclaimerProps {
  compact?: boolean;
}

export const ClinicalDisclaimer: React.FC<ClinicalDisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
        <ShieldAlert size={16} className="text-amber-600 shrink-0" />
        <span>
          <strong>Clinical Verification Notice:</strong> Compatibility suggestions are preliminary computer filters. Mandatory serological crossmatching is required prior to transfusion.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700 mt-0.5">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-amber-950 text-sm">
            Clinical Protocol & Transfusion Safety Notice
          </h4>
          <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
            Blood component compatibility results and algorithmic donor rankings provided by this system are designed strictly as preliminary coordination aids. They do <strong>not</strong> authorize clinical transfusion. Standard operating procedures requiring serological crossmatching, pathogen screening (HIV, HBV, HCV, Syphilis, Malaria), and signed physician verification must always be completed at the receiving blood bank or hospital.
          </p>
        </div>
      </div>
    </div>
  );
};
