.class public Lcom/ec/ffmpeg/FFmpegMerge;
.super Ljava/lang/Object;

.source "FFmpegMerge.java"

# static fields
.field private static sFfmpegPath:Ljava/lang/String;
.field private static sInitialized:Z

# direct methods
.method public constructor <init>()V
    .locals 1

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method public static init(Ljava/lang/String;)Z
    .locals 2

    sput-object p1, Lcom/ec/ffmpeg/FFmpegMerge;->sFfmpegPath:Ljava/lang/String;
    sput-boolean v0, Lcom/ec/ffmpeg/FFmpegMerge;->sInitialized:Z

    const-string v0, "FFmpegMerge"
    new-instance v1, Ljava/lang/StringBuilder;
    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V
    const-string v2, "initialized: "
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    move-result-object v1
    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    move-result-object v1
    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
    move-result-object v1
    invoke-static {v0, v1}, Landroid/util/Log;->i(Ljava/lang/String;Ljava/lang/String;)I

    const/4 p1, 0x1
    return p1
.end method

.method public static isAvailable()Z
    .locals 1

    sget-boolean v0, Lcom/ec/ffmpeg/FFmpegMerge;->sInitialized:Z
    return v0
.end method

.method public static getFfmpegPath()Ljava/lang/String;
    .locals 1

    sget-object v0, Lcom/ec/ffmpeg/FFmpegMerge;->sFfmpegPath:Ljava/lang/String;
    return-object v0
.end method

.method public static mergeVideos(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Z
    .locals 6
    .param p0    # Ljava/lang/String;
    .param p1    # Ljava/lang/String;
    .param p2    # Ljava/lang/String;

    sget-boolean v0, Lcom/ec/ffmpeg/FFmpegMerge;->sInitialized:Z
    if-eqz v0, :Lnot_initialized

    :Lnot_initialized
    const/4 v0, 0x0
    return v0
.end method
