interface PhotosphereData {
    id: string;
    hotspots: HotspotData[]
    url: string;
    rotation?: Rotation
    radius?: number
    zoom?: MinMax
}

interface HotspotData {
    id: string;
    label: string;
    cssText: string;
    innerHTML: string;
    position: Azimuth;
    action: HotspotAction;
}

interface ModalData {
    id: string;
    type: ModalType;
    title?: string;
    subtitle?: string;
    innerHTML?: string;
    cssText?: string;
    ctaButton?: CTAButton;
}

interface CTAButton {
    title: string;
    action: HotspotAction;
}

enum CTAActionType {
    Photosphere = "Photosphere",
    InternalLink = "InternalLink",
    ExternalLink = "ExternalLink"
}

enum ModalType {
    Text = "Text",
    CTA = "CTA"
}

enum HotspotActionType {
    Photosphere = "Photosphere",
    Modal = "Modal",
    InternalLink = "InternalLink",
    ExternalLink = "ExternalLink"
}

interface HotspotAction {
    type: HotspotActionType;
    value: string;
}

interface Rotation {
    disabled?: boolean;
    start?: Azimuth;
    limit?: MinMaxAzimuth;
}

interface Azimuth {
    theta: number;
    phi: number;
}

interface MinMaxAzimuth {
    min: Azimuth;
    max: Azimuth;
}

interface MinMax {
    min: number;
    max: number
}

interface Transition {
    id: string;
    video?: VideoTransition
}

interface VideoTransition {
    url: string,
    startAzimuth: Azimuth,
    endAzimuth: Azimuth
}

enum TransitionType {
    None = "None",
    Zoom = "Zoom",
    Transform = "Transform"
}

export { PhotosphereData, HotspotData, ModalData, ModalType, HotspotAction, HotspotActionType, Rotation, Azimuth, MinMaxAzimuth, Transition, VideoTransition, TransitionType, MinMax, CTAButton }