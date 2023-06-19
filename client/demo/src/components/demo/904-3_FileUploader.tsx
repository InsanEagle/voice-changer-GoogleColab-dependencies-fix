import React, { useEffect, useMemo, useState } from "react";
import { useAppState } from "../../001_provider/001_AppStateProvider";
import { FileUploadSetting, InitialFileUploadSetting, ModelFileKind, ModelUploadSetting, VoiceChangerType, fileSelector } from "@dannadori/voice-changer-client-js";
import { useMessageBuilder } from "../../hooks/useMessageBuilder";
import { ModelSlotManagerDialogScreen } from "./904_ModelSlotManagerDialog";
import { checkExtention, trimfileName } from "../../utils/utils";

export type FileUploaderScreenProps = {
    screen: ModelSlotManagerDialogScreen
    targetIndex: number
    close: () => void
    backToSlotManager: () => void
}

export const FileUploaderScreen = (props: FileUploaderScreenProps) => {
    const { serverSetting } = useAppState()
    const [voiceChangerType, setVoiceChangerType] = useState<VoiceChangerType>("RVC")
    const [uploadSetting, setUploadSetting] = useState<ModelUploadSetting>()
    const messageBuilderState = useMessageBuilder()

    useMemo(() => {
        messageBuilderState.setMessage(__filename, "select", { "ja": "ファイル選択", "en": "select file" })
        messageBuilderState.setMessage(__filename, "upload", { "ja": "アップロード", "en": "upload" })
        messageBuilderState.setMessage(__filename, "alert-model-ext", {
            "ja": "ファイルの拡張子は次のモノである必要があります。",
            "en": "extension of file should be the following."
        })
        messageBuilderState.setMessage(__filename, "alert-model-file", {
            "ja": "ファイルが選択されていません",
            "en": "file is not selected."
        })
    }, [])

    useEffect(() => {
        setUploadSetting({
            voiceChangerType: voiceChangerType,
            slot: props.targetIndex,
            isSampleMode: false,
            sampleId: null,
            files: [],
        })
    }, [props.targetIndex, voiceChangerType])

    const screen = useMemo(() => {
        if (props.screen != "FileUploader") {
            return <></>
        }

        const vcTypeOptions = (
            Object.values(VoiceChangerType).map(x => {
                return <option key={x} value={x}>{x}</option>
            })
        )

        const checkModelSetting = (setting: ModelUploadSetting) => {
            if (setting.voiceChangerType == "RVC") {
                // const enough = !!setting.files.find(x => { return x.kind == "rvcModel" }) &&
                //     !!setting.files.find(x => { return x.kind == "rvcIndex" })
                // return enough
                const enough = !!setting.files.find(x => { return x.kind == "rvcModel" })
                return enough
            }
        }

        const generateFileRow = (setting: ModelUploadSetting, title: string, kind: ModelFileKind, ext: string[]) => {
            const selectedFile = setting.files.find(x => { return x.kind == kind })
            const selectedFilename = selectedFile?.file.name || ""
            return (
                <div key={`${title}`} className="file-uploader-file-select-row">
                    <div className="file-uploader-file-select-row-label">{title}:</div>
                    <div className="file-uploader-file-select-row-value" >
                        {trimfileName(selectedFilename, 30)}
                    </div>
                    <div className="file-uploader-file-select-row-button" onClick={async () => {
                        const file = await fileSelector("")
                        if (checkExtention(file.name, ext) == false) {
                            const alertMessage = `${messageBuilderState.getMessage(__filename, "alert-model-ext")} ${ext}`
                            alert(alertMessage)
                            return
                        }
                        if (selectedFile) {
                            selectedFile.file = file
                        } else {
                            setting.files.push({ kind: kind, file: file })
                        }
                        setUploadSetting({ ...setting })
                    }}>
                        {messageBuilderState.getMessage(__filename, "select")}
                    </div>
                </div>
            )
        }

        const generateFileRowsByVCType = (vcType: VoiceChangerType) => {
            const rows: JSX.Element[] = []
            if (vcType == "RVC") {
                rows.push(generateFileRow(uploadSetting!, "Model", "rvcModel", ["pth", "onnx"]))
                rows.push(generateFileRow(uploadSetting!, "Index", "rvcIndex", ["index", "bin"]))
            }
            return rows
        }
        const fileRows = generateFileRowsByVCType(voiceChangerType)

        return (
            <div className="dialog-frame">
                <div className="dialog-title">File Uploader</div>
                <div className="dialog-fixed-size-content">
                    <div className="file-uploader-header">Upload Files for Slot[{props.targetIndex}]  <span onClick={() => {
                        props.backToSlotManager()
                    }} className="file-uploader-header-button">&lt;&lt;back</span></div>
                    <div className="file-uploader-voice-changer-select" >VoiceChangerType:
                        <select value={voiceChangerType} onChange={(e) => {
                            setVoiceChangerType(e.target.value as VoiceChangerType)
                        }}>
                            {vcTypeOptions}
                        </select>
                    </div>

                    <div className="file-uploader-file-select-container">
                        {fileRows}
                    </div>
                    <div className="file-uploader-file-select-upload-button-container">
                        <div className="file-uploader-file-select-upload-button" onClick={() => {
                            if (!uploadSetting) {
                                return
                            }
                            if (checkModelSetting(uploadSetting)) {
                                serverSetting.uploadModel(uploadSetting)
                            } else {
                                const errorMessage = messageBuilderState.getMessage(__filename, "alert-model-file")
                                alert(errorMessage)
                            }
                        }}>
                            {messageBuilderState.getMessage(__filename, "upload")}
                        </div>
                    </div>
                </div>
            </div>
        )

    }, [
        props.screen,
        props.targetIndex,
        voiceChangerType,
        uploadSetting,
        serverSetting.uploadModel
    ])



    return screen;

};