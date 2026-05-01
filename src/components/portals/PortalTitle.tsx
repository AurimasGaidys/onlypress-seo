import { usePortalsContext } from "@/context/portalContext/usePortalsContext";

export const PortalTitle = ({ portalId }: { portalId: string }) => {
    const { getPortal } = usePortalsContext();
    const portal = getPortal(portalId);

    if (!portal) {
        return <>Portal not found</>;
    }

    console.log("Rendering PortalTitle with portalId:", portalId);
    return (
        <>
            {portal.title}
        </>
    );

}