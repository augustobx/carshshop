import VehiculoForm from "@/components/vehiculos/VehiculoForm";

export const metadata = {
    title: 'Ingresar Vehículo | CarShop ERP',
};

export default function AgregarVehiculoPage() {
    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <VehiculoForm />
        </div>
    );
}