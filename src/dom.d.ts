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