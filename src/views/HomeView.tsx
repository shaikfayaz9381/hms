import React, { useEffect, useState } from 'react';
import {
  Activity,
  Ambulance,
  ArrowRight,
  Award,
  Baby,
  BedDouble,
  Bone,
  Brain,
  Building2,
  CalendarCheck2,
  Clock,
  FileText,
  HeartPulse,
  Mail,
  MapPin,
  Menu,
  Microscope,
  Phone,
  Pill,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { PublicOverview } from '../types';

interface HomeViewProps {
  onLoginClick: () => void;
}

const DEPARTMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CARD: HeartPulse,
  NEUR: Brain,
  PEDI: Baby,
  ORTH: Bone,
  GMED: Stethoscope,
  EMER: Ambulance,
};

// Fallback content so the public website still renders if the API is unreachable
const FALLBACK_OVERVIEW: PublicOverview = {
  hospital: {
    name: 'MedPulse Hospital',
    tagline: 'Compassionate care, advanced medicine.',
    phone: '+91-98765-43000',
    emergencyPhone: '+91-98765-43911',
    email: 'contact@medpulse.in',
    address: 'MedPulse Hospital, 42 Ring Road, Lajpat Nagar, New Delhi 110024',
    hours: 'OPD: Mon–Sat, 9:00 AM – 6:00 PM · Emergency: 24/7',
  },
  stats: { doctors: 5, departments: 6, rooms: 10, availableRooms: 6, medicines: 15 },
  departments: [
    { id: 'dept-1', name: 'Cardiology', code: 'CARD', description: 'Comprehensive heart & cardiovascular care', location: 'Wing A, 3rd Floor', doctorCount: 1 },
    { id: 'dept-2', name: 'Neurology', code: 'NEUR', description: 'Brain, spine, and nervous system disorders', location: 'Wing B, 4th Floor', doctorCount: 1 },
    { id: 'dept-3', name: 'Pediatrics', code: 'PEDI', description: 'Infant, child, and adolescent healthcare', location: 'Wing A, 2nd Floor', doctorCount: 1 },
    { id: 'dept-4', name: 'Orthopedics', code: 'ORTH', description: 'Musculoskeletal trauma, joints, and spine', location: 'Wing C, Ground Floor', doctorCount: 1 },
    { id: 'dept-5', name: 'General Medicine', code: 'GMED', description: 'Primary internal healthcare and diagnosis', location: 'Main Building, Ground Floor', doctorCount: 1 },
    { id: 'dept-6', name: 'Emergency Medicine', code: 'EMER', description: '24/7 Trauma and acute care', location: 'Emergency Block, Ground Floor', doctorCount: 0 },
  ],
  doctors: [],
};

const SERVICES = [
  { icon: Ambulance, title: '24/7 Emergency & Trauma', text: 'Round-the-clock emergency physicians, triage bays, and ambulance support.' },
  { icon: Microscope, title: 'Diagnostics & Laboratory', text: 'Pathology, imaging referrals, and same-day clinical lab reporting.' },
  { icon: BedDouble, title: 'Inpatient Wards & ICU', text: 'General wards, private rooms, and fully monitored intensive care units.' },
  { icon: Pill, title: 'Pharmacy', text: 'In-house pharmacy with digital prescriptions and live medicine inventory.' },
  { icon: CalendarCheck2, title: 'Digital Appointments', text: 'Time-slot booking with conflict-free scheduling across all departments.' },
  { icon: FileText, title: 'Electronic Health Records', text: 'Secure MRN-based patient charts, diagnoses, and prescription history.' },
];

const NAV_LINKS = [
  { href: '#departments', label: 'Departments' },
  { href: '#doctors', label: 'Our Doctors' },
  { href: '#services', label: 'Services' },
  { href: '#contact', label: 'Contact' },
];

export const HomeView: React.FC<HomeViewProps> = ({ onLoginClick }) => {
  const [overview, setOverview] = useState<PublicOverview>(FALLBACK_OVERVIEW);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    api
      .getPublicOverview()
      .then(data => {
        if (data?.departments?.length) setOverview(data);
      })
      .catch(() => {
        // Keep fallback content when the API is unreachable
      });
  }, []);

  const { hospital, stats, departments, doctors } = overview;

  return (
    <div className="min-h-screen bg-white text-slate-800 scroll-smooth">
      {/* ===== Top Navigation Bar ===== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a href="#home" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <span className="block text-lg font-bold tracking-tight text-slate-900">MedPulse</span>
              <span className="block text-[10px] font-medium uppercase tracking-widest text-slate-500">Hospital</span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} className="hover:text-teal-700 transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${hospital.emergencyPhone.replace(/[^+\d]/g, '')}`}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Emergency: {hospital.emergencyPhone}</span>
            </a>
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Portal Login</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-slate-100 bg-white px-6 py-3 space-y-1 text-sm font-medium text-slate-600">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 hover:text-teal-700"
              >
                {link.label}
              </a>
            ))}
            <a
              href={`tel:${hospital.emergencyPhone.replace(/[^+\d]/g, '')}`}
              className="block py-2 font-semibold text-rose-700"
            >
              Emergency: {hospital.emergencyPhone}
            </a>
          </nav>
        )}
      </header>

      {/* ===== Hero ===== */}
      <section id="home" className="relative overflow-hidden bg-slate-900 text-white">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-slate-900 to-slate-900" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-teal-300 bg-teal-500/10 border border-teal-400/20 rounded-full px-3 py-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              NABH-inspired care standards
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              Compassionate care,
              <br />
              <span className="text-teal-300">advanced medicine.</span>
            </h1>
            <p className="mt-5 text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              {hospital.name} brings together experienced specialists, modern diagnostics, and a
              fully digital patient experience — from your first consultation to your recovery.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={onLoginClick}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 shadow-lg shadow-teal-500/20 transition-colors cursor-pointer"
              >
                <span>Book an appointment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={`tel:${hospital.emergencyPhone.replace(/[^+\d]/g, '')}`}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors"
              >
                <Phone className="w-4 h-4 text-rose-300" />
                <span>Emergency {hospital.emergencyPhone}</span>
              </a>
            </div>

            <p className="mt-6 text-xs text-slate-400">
              Patients &amp; hospital staff can access the secure portal to manage appointments,
              records, prescriptions, and billing.
            </p>
          </div>

          {/* Hero side card */}
          <div className="lg:justify-self-end w-full max-w-md">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
              <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-widest">
                <Clock className="w-4 h-4" />
                Visit us today
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                  <span className="text-slate-200">{hospital.address}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                  <span className="text-slate-200">
                    Reception: {hospital.phone}
                    <br />
                    Emergency: {hospital.emergencyPhone}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                  <span className="text-slate-200">{hospital.hours}</span>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-center">
                <div className="bg-white/5 rounded-xl py-3">
                  <div className="text-2xl font-bold text-teal-300 font-mono">{stats.doctors}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Specialist doctors</div>
                </div>
                <div className="bg-white/5 rounded-xl py-3">
                  <div className="text-2xl font-bold text-teal-300 font-mono">{stats.departments}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Clinical departments</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Stats Band ===== */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 font-mono">{stats.doctors}+</div>
              <div className="text-[11px] text-slate-500">Expert Doctors</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 font-mono">{stats.departments}</div>
              <div className="text-[11px] text-slate-500">Departments</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 font-mono">{stats.availableRooms}/{stats.rooms}</div>
              <div className="text-[11px] text-slate-500">Beds Available Now</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 font-mono">{stats.medicines}+</div>
              <div className="text-[11px] text-slate-500">Pharmacy Items</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Departments ===== */}
      <section id="departments" className="bg-slate-50 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-widest text-teal-700">Departments</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Specialized clinical care under one roof
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Our clinical wings are staffed by experienced consultants and supported by modern
              diagnostic and inpatient facilities.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {departments.map(dept => {
              const Icon = DEPARTMENT_ICONS[dept.code] || Activity;
              return (
                <div
                  key={dept.id}
                  className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md hover:border-teal-200 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase">{dept.code}</span>
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900">{dept.name}</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed min-h-[32px]">
                    {dept.description || 'Specialist consultation and inpatient care.'}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {dept.location || 'Main Building'}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-teal-700">
                      <Users className="w-3 h-3" />
                      {dept.doctorCount} {dept.doctorCount === 1 ? 'Doctor' : 'Doctors'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Doctors ===== */}
      {doctors.length > 0 && (
        <section id="doctors" className="bg-white py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="text-[11px] font-bold uppercase tracking-widest text-teal-700">Our Doctors</span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Meet our senior consultants
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                Board-certified specialists committed to precise diagnosis and compassionate treatment.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {doctors.map(doc => {
                const initials = doc.name
                  .replace(/^Dr\.?\s*/i, '')
                  .split(' ')
                  .map(part => part[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                return (
                  <div key={doc.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-lg font-bold shadow-sm shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{doc.name}</h3>
                        <p className="text-xs text-teal-700 font-medium truncate">{doc.specialization}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{doc.department} Department</p>
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        {doc.experienceYears} years experience
                      </span>
                      <span className="font-mono font-semibold text-slate-800">₹{doc.consultationFee.toFixed(0)} / visit</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={onLoginClick}
                className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                <span>Book an appointment with a specialist</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ===== Services ===== */}
      <section id="services" className="bg-slate-50 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-widest text-teal-700">Hospital Services</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Everything you need for a safe recovery
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              From emergency response to everyday outpatient care, our facilities are built around
              patient safety and comfort.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map(service => {
              const Icon = service.icon;
              return (
                <div key={service.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{service.title}</h3>
                  </div>
                  <p className="mt-3 text-xs text-slate-500 leading-relaxed">{service.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Contact ===== */}
      <section id="contact" className="bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-teal-700">Contact &amp; Visiting</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              We are here to help, around the clock
            </h2>
            <p className="mt-3 text-sm text-slate-500 max-w-lg">
              Walk in for OPD consultations or call ahead for appointments. Emergencies are attended
              immediately at the Emergency Block, Ground Floor.
            </p>

            <div className="mt-8 space-y-5 text-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Address</div>
                  <div className="text-slate-600 text-xs mt-0.5">{hospital.address}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Phone</div>
                  <div className="text-slate-600 text-xs mt-0.5">
                    Reception: <a href={`tel:${hospital.phone.replace(/[^+\d]/g, '')}`} className="text-teal-700 hover:underline">{hospital.phone}</a>
                    <br />
                    Emergency: <a href={`tel:${hospital.emergencyPhone.replace(/[^+\d]/g, '')}`} className="text-rose-700 hover:underline">{hospital.emergencyPhone}</a>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Email</div>
                  <div className="text-slate-600 text-xs mt-0.5">
                    <a href={`mailto:${hospital.email}`} className="text-teal-700 hover:underline">{hospital.email}</a>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Opening Hours</div>
                  <div className="text-slate-600 text-xs mt-0.5">{hospital.hours}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Portal CTA card */}
          <div className="bg-slate-900 text-white rounded-2xl p-8 lg:p-10 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-teal-500/20 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" />
                Patient &amp; Staff Portal
              </div>
              <h3 className="mt-4 text-2xl font-bold tracking-tight">
                Your health records, appointments, and prescriptions — in one secure place.
              </h3>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> View and book appointments
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> Access diagnoses and medical history
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> Track prescriptions and billing statements
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> Clinician tools for schedules and records
                </li>
              </ul>
              <button
                onClick={onLoginClick}
                className="mt-8 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Sign in to the portal</span>
              </button>
              <p className="mt-4 text-[11px] text-slate-400">
                New patient? Create an account from the login page in a minute.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-slate-900 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <span className="font-bold text-base">MedPulse Hospital</span>
            </div>
            <p className="mt-3 max-w-md leading-relaxed">
              A multi-specialty hospital committed to compassionate care, modern diagnostics, and a
              seamless digital experience for our patients and their families.
            </p>
          </div>
          <div>
            <div className="text-white font-semibold mb-3 uppercase tracking-wider text-[11px]">Quick Links</div>
            <ul className="space-y-2">
              {NAV_LINKS.map(link => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-teal-300 transition-colors">{link.label}</a>
                </li>
              ))}
              <li>
                <button onClick={onLoginClick} className="hover:text-teal-300 transition-colors cursor-pointer">
                  Portal Login
                </button>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-white font-semibold mb-3 uppercase tracking-wider text-[11px]">Contact</div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{hospital.address}</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Emergency: {hospital.emergencyPhone}</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{hospital.email}</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
            <span>© 2026 MedPulse Hospital. All rights reserved.</span>
            <span>Academic college demonstration project · Not for real clinical use</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
