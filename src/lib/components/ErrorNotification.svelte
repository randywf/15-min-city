<!-- src/lib/components/ErrorNotification.svelte -->
<script lang="ts">
    let notifications: Array<{
        id: string;
        message: string;
        type: 'error' | 'success';
        progress: number;
    }> = [];

    let nextId = 0;

    export function addNotification(message: string, type: 'error' | 'success' = 'error') {
        const id = String(nextId++);
        const notification = {
            id,
            message,
            type,
            progress: 100,
        };

        notifications = [...notifications, notification];

        let progressInterval: any;
        const duration = 10000; // 10 seconds
        const steps = 100;
        const stepDuration = duration / steps;
        let currentStep = steps;

        progressInterval = setInterval(() => {
            currentStep--;
            notifications = notifications.map((n) =>
                n.id === id ? { ...n, progress: (currentStep / steps) * 100 } : n
            );

            if (currentStep <= 0) {
                clearInterval(progressInterval);
                removeNotification(id);
            }
        }, stepDuration);

        return id;
    }

    function removeNotification(id: string) {
        notifications = notifications.filter((n) => n.id !== id);
    }
</script>

<div class="notification-container">
    {#each notifications as notification (notification.id)}
        <div class={`notification notification-${notification.type}`}>
            <div class="notification-content">
                <p>{notification.message}</p>
            </div>
            <div class="progress-bar">
                <div
                    class="progress-fill"
                    style="width: {notification.progress}%"
                ></div>
            </div>
        </div>
    {/each}
</div>

<style>
    .notification-container {
        position: fixed;
        bottom: 28px;
        right: 80px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 1000;
        pointer-events: none;
    }

    .notification {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        min-width: 300px;
        animation: slideIn 0.3s ease-out;
        pointer-events: auto;
    }

    .notification-error {
        border-left: 4px solid #ef4444;
    }

    .notification-success {
        border-left: 4px solid #22c55e;
    }

    .notification-content {
        padding: 16px;
    }

    .notification-content p {
        margin: 0;
        color: #1f2937;
        font-size: 14px;
        font-weight: 500;
    }

    .progress-bar {
        height: 4px;
        background: #e5e7eb;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: #22c55e;
        transition: width 0.1s linear;
    }

    @keyframes slideIn {
        from {
            transform: translateX(-350px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
</style>