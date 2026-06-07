import React from 'react';
import { Award, ShieldCheck, Globe } from 'lucide-react';

interface CertificateTemplateProps {
  recipientName: string;
  courseTitle: string;
  issueDate: string;
  credentialId: string;
  signerName: string;
  signerSignature?: string;
  schoolName?: string;
}

export const CertificateTemplate: React.FC<CertificateTemplateProps> = ({
  recipientName,
  courseTitle,
  issueDate,
  credentialId,
  signerName,
  signerSignature,
  schoolName
}) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = isNaN(Number(dateStr)) ? new Date(dateStr) : new Date(Number(dateStr));
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div className="relative w-full aspect-[1.414/1] bg-white text-[#1a3d3d] overflow-hidden border-[16px] border-[#d4af37] shadow-2xl font-serif">
      {/* Decorative Corners */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-[#d4af37]/30" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-[#d4af37]/30" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-[#d4af37]/30" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-[#d4af37]/30" />

      {/* Content Container */}
      <div className="flex flex-col items-center justify-between h-full py-10 px-16 text-center">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-[#1a3d3d] flex items-center justify-center p-3">
              <img 
                src="/assets/logo.png" 
                alt="Bootskills Logo" 
                className="w-full h-full object-contain brightness-0 invert" 
              />
            </div>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-[#1a3d3d]">
            Certificate of Completion
          </h1>
          <p className="text-base italic text-[#1a3d3d]/60">
            This is to certify that
          </p>
        </div>

        {/* Recipient */}
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-[#d4af37] drop-shadow-sm px-4 border-b-2 border-[#d4af37]/20 pb-2">
            {recipientName}
          </h2>
          <p className="text-lg italic text-[#1a3d3d]/60 mt-4">
            has successfully completed the professional program in
          </p>
          <h3 className="text-2xl font-bold uppercase tracking-tight text-[#1a3d3d]">
            {courseTitle}
          </h3>
        </div>

        {/* Footer / Signatures */}
        <div className="w-full grid grid-cols-3 items-end pt-4">
          {/* Issue Date */}
          <div className="text-left space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a3d3d]/40">Issue Date</p>
            <p className="text-xs font-bold">{formatDate(issueDate)}</p>
            <div className="w-24 h-0.5 bg-[#d4af37]/30" />
            <p className="text-[8px] font-bold text-[#1a3d3d]/30 mt-2">ID: {credentialId}</p>
          </div>

          {/* Seal */}
          <div className="flex justify-center relative">
            <div className="w-20 h-20 rounded-full border-4 border-[#d4af37] flex items-center justify-center bg-[#d4af37]/5 rotate-12">
              <Award className="w-10 h-10 text-[#d4af37]" />
            </div>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-[#d4af37]/20 shadow-sm">
               <ShieldCheck className="w-2.5 h-2.5 text-[#d4af37]" />
               <span className="text-[7px] font-bold text-[#d4af37] uppercase tracking-tighter">Verified CMD</span>
            </div>
          </div>

          {/* Signature */}
          <div className="text-right space-y-1">
            <div className="relative h-10 flex items-end justify-end">
              {signerSignature ? (
                <img src={signerSignature} alt="Signature" className="h-14 absolute bottom-0 right-0 mix-blend-multiply" />
              ) : (
                <p className="text-xl font-handwriting text-[#1a3d3d]/80 italic">{signerName}</p>
              )}
            </div>
            <div className="w-24 h-0.5 bg-[#d4af37]/30 ml-auto" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a3d3d]/40">Authorized Signatory</p>
            <p className="text-xs font-bold">{signerName}</p>
          </div>
        </div>

        {/* Verification Info */}
        <div className="mt-8 pt-6 border-t border-[#d4af37]/10 w-full flex justify-between items-center text-[10px] font-bold text-[#1a3d3d]/40 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3" />
            {typeof window !== 'undefined' ? window.location.host : 'academy.bootskills.com'}/verify/{credentialId}
          </div>
          <div>
            {schoolName ? schoolName.toUpperCase() : "BOOTSKILLS ACADEMY"} • KIGALI, RWANDA
          </div>
        </div>
      </div>
    </div>
  );
};
