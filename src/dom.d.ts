declare var EyeDropper:{
    new ():{
        open():Promise<{sRGBHex:string}>
    }
}
declare var documentPictureInPicture:{
    requestWindow:(option?:{height:number,width:number})=>Promise<Window & typeof globalThis>
}
declare function showOpenFilePicker():Promise<FileSystemFileHandle[]>
declare function showSaveFilePicker(options?:{suggestedName:string}):Promise<FileSystemFileHandle>
declare function showDirectoryPicker(options?:{startIn?:string,mode:"readwrite"|"read"}):Promise<FileSystemDirectoryHandle>
declare interface Performance{
    getEntriesByType(type:"resource"):PerformanceResourceTiming[]
    memory:{
        jsHeapSizeLimit:number
        totalJSHeapSize:number
    }
}
declare interface NavigatorStorage{
    storageBuckets:{
        keys():Promise<any[]>
    }
}